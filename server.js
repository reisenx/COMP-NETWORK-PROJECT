const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/message');
const {userJoin , getCurrentUser, userLeave} = require('./utils/user');
const {getRoomUsers , getAllUsers} = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
const botname = 'Slave Bot';
// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botname ,'Welcome to ComNetwork Project'));

        console.log(user.username + ' has joined the chat');

        // Broadcast when a user connects
        socket.broadcast.
        to(user.room).
        emit('message', 
        formatMessage(
            botname
            , user.username + ' has joined the chat'
        ));
        // send all users to everyuser
        io.emit('allUsers', {
            users: getAllUsers() 
        });

        // send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });

        
    });
    // listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });
    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message',formatMessage(botname,user.username + ' has left the chat'));

            // send users and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
            io.emit('allUsers', {
                users: getAllUsers()
            });
        
        }
});

});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));