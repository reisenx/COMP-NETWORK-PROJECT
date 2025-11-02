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
    // Call your helper (it returns user OR {error})
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
  });

  // Listen for chat messages
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      // Socket may have lost its user (e.g., race on refresh)
      socket.emit('joinError', 'You are not in a room');
      return;
    }
    io.to(user.room).emit('message', formatMessage(user.username, msg));
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
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
