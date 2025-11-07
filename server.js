const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/message');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers
} = require('./utils/user');
const {
  createGroup,
  getAllGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  isGroupMember
} = require('./utils/groups');
const {
  addRoomMessage,
  addPrivateMessage,
  addGroupMessage,
  getRoomHistory,
  getPrivateHistory,
  getGroupHistory
} = require('./utils/messageHistory');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const botname = 'Slave Bot';

// Track join times for private chats (socketId + otherUsername -> joinTime)
const privateChatJoinTimes = new Map();

// Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    // userJoin() handles removing existing users with the same socket.id internally
    // Now check for duplicate username and add new user
    const result = userJoin(socket.id, username, room);
    if (result && result.error) {
      // Tell the client and stop here
      socket.emit('joinError', result.error);
      return;
    }

    const user = result; // valid user object
    socket.join(user.room);

    // Send chat history for this room (only messages after user joined)
    const roomHistory = getRoomHistory(user.room, user.joinTime);
    if (roomHistory.length > 0) {
      socket.emit('roomHistory', { room: user.room, messages: roomHistory });
    }

    // Welcome current user
    const welcomeMsg = formatMessage(botname, 'Welcome to ComNetwork Project');
    socket.emit('message', welcomeMsg);
    console.log(`${user.username} has joined the chat`);

    // Broadcast when a user connects (to others in the room)
    const joinMsg = formatMessage(botname, `${user.username} has joined the chat`);
    socket.broadcast.to(user.room).emit('message', joinMsg);
    
    // Save join message to history
    addRoomMessage(user.room, botname, `${user.username} has joined the chat`);

    // Send room users to that room
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    // Send all users to everyone
    io.emit('allUsers', { users: getAllUsers() });
    
    // Send all groups to the new user
    socket.emit('allGroups', { groups: getAllGroups() });
  });

  // Listen for room chat messages (R6)
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('joinError', 'You are not in a room');
      return;
    }
    const formattedMessage = addRoomMessage(user.room, user.username, msg);
    io.to(user.room).emit('message', formattedMessage);
  });

  // R7: Private message handler
  socket.on('privateMessage', ({ toUsername, message }) => {
    const sender = getCurrentUser(socket.id);
    if (!sender) {
      socket.emit('joinError', 'You are not in a room');
      return;
    }

    const allUsers = getAllUsers();
    const receiver = allUsers.find(u => u.username === toUsername);
    
    if (!receiver) {
      socket.emit('privateMessageError', `User ${toUsername} is not online`);
      return;
    }

    if (receiver.username === sender.username) {
      socket.emit('privateMessageError', 'You cannot send a message to yourself');
      return;
    }

    // Create private room name (sorted to ensure consistency)
    const privateRoom = [sender.username, receiver.username].sort().join('_pm_');
    
    // Save message to history
    const formattedMessage = addPrivateMessage(sender.username, receiver.username, sender.username, message);
    
    // Send to receiver
    io.to(receiver.id).emit('privateMessage', {
      from: sender.username,
      message: formattedMessage,
      room: privateRoom
    });

    // Send confirmation to sender
    socket.emit('privateMessage', {
      from: sender.username,
      to: receiver.username,
      message: formattedMessage,
      room: privateRoom
    });
  });

  // Request private chat history
  socket.on('requestPrivateHistory', ({ otherUsername }) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('joinError', 'You are not in a room');
      return;
    }
    
    // Private chats show ALL messages (no filtering by join time)
    const history = getPrivateHistory(user.username, otherUsername);
    socket.emit('privateHistory', { 
      otherUsername, 
      messages: history 
    });
  });

  // R8: Create group handler
  socket.on('createGroup', ({ groupName }) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('groupError', 'You are not in a room');
      return;
    }

    const result = createGroup(groupName, user.username, socket.id);
    if (result.error) {
      socket.emit('groupError', result.error);
      return;
    }

    // Join socket to group room
    socket.join(`group_${result.group.name}`);
    
    // Notify all clients about the new group
    io.emit('allGroups', { groups: getAllGroups() });
    
    socket.emit('groupCreated', { group: result.group, joinTime: result.joinTime });
  });

  // R9: Get all groups (already handled on connection, but can be requested)
  socket.on('requestGroups', () => {
    socket.emit('allGroups', { groups: getAllGroups() });
  });

  // R10: Join group handler
  socket.on('joinGroup', ({ groupName }) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('groupError', 'You are not in a room');
      return;
    }

    const result = joinGroup(groupName, user.username, socket.id);
    if (result.error) {
      socket.emit('groupError', result.error);
      return;
    }

    // Join socket to group room
    socket.join(`group_${result.group.name}`);
    
    // Notify group members
    result.group.members.forEach(member => {
      const memberUser = getAllUsers().find(u => u.username === member.username);
      if (memberUser) {
        io.to(memberUser.id).emit('groupJoined', {
          groupName: result.group.name,
          username: user.username
        });
      }
    });

    // Update all clients with group list
    io.emit('allGroups', { groups: getAllGroups() });
    
    socket.emit('groupJoinedSuccess', { group: result.group, joinTime: result.joinTime });
  });

  // R11: Group message handler
  socket.on('groupMessage', ({ groupName, message }) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('groupError', 'You are not in a room');
      return;
    }

    if (!isGroupMember(groupName, socket.id)) {
      socket.emit('groupError', 'You are not a member of this group');
      return;
    }

    // Save message to history
    const formattedMessage = addGroupMessage(groupName, user.username, message);

    // Send message to all group members
    io.to(`group_${groupName}`).emit('groupMessage', {
      groupName,
      message: formattedMessage
    });
  });

  // Request group chat history
  socket.on('requestGroupHistory', ({ groupName }) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      socket.emit('groupError', 'You are not in a room');
      return;
    }
    if (!isGroupMember(groupName, socket.id)) {
      socket.emit('groupError', 'You are not a member of this group');
      return;
    }
    
    // Get user's join time for this group
    const group = getGroup(groupName);
    const member = group.members.find(m => m.id === socket.id);
    const joinTime = member ? (member.joinTime || Date.now()) : Date.now();
    
    // Only get messages sent after user joined the group
    const history = getGroupHistory(groupName, joinTime);
    socket.emit('groupHistory', { 
      groupName, 
      messages: history 
    });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    // Clean up private chat join times for this socket
    for (const [key, value] of privateChatJoinTimes.entries()) {
      if (key.startsWith(`${socket.id}_`)) {
        privateChatJoinTimes.delete(key);
      }
    }
    
    const user = userLeave(socket.id);
    if (!user) return;

    io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));

    // Update lists
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    io.emit('allUsers', { users: getAllUsers() });
    
    // Remove user from all groups and update group list
    const allGroups = getAllGroups();
    allGroups.forEach(groupInfo => {
      const group = getGroup(groupInfo.name);
      if (group && group.members.some(m => m.id === socket.id)) {
        leaveGroup(groupInfo.name, socket.id);
      }
    });
    io.emit('allGroups', { groups: getAllGroups() });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
