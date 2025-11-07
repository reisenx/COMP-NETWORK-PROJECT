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

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const botname = 'Slave Bot';

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

    // Welcome current user
    socket.emit('message', formatMessage(botname, 'Welcome to ComNetwork Project'));
    console.log(`${user.username} has joined the chat`);

    // Broadcast when a user connects (to others in the room)
    socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botname, `${user.username} has joined the chat`));

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
    io.to(user.room).emit('message', formatMessage(user.username, msg));
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
    
    // Send to receiver
    io.to(receiver.id).emit('privateMessage', {
      from: sender.username,
      message: formatMessage(sender.username, message),
      room: privateRoom
    });

    // Send confirmation to sender
    socket.emit('privateMessage', {
      from: sender.username,
      to: receiver.username,
      message: formatMessage(sender.username, message),
      room: privateRoom
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
    socket.join(`group_${result.name}`);
    
    // Notify all clients about the new group
    io.emit('allGroups', { groups: getAllGroups() });
    
    socket.emit('groupCreated', { group: result });
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
    socket.join(`group_${result.name}`);
    
    // Notify group members
    result.members.forEach(member => {
      const memberUser = getAllUsers().find(u => u.username === member.username);
      if (memberUser) {
        io.to(memberUser.id).emit('groupJoined', {
          groupName: result.name,
          username: user.username
        });
      }
    });

    // Update all clients with group list
    io.emit('allGroups', { groups: getAllGroups() });
    
    socket.emit('groupJoinedSuccess', { group: result });
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

    // Send message to all group members
    io.to(`group_${groupName}`).emit('groupMessage', {
      groupName,
      message: formatMessage(user.username, message)
    });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
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
