/**
 * @fileoverview Main server entry point
 * Initializes Express server and Socket.IO with modular handlers
 */

const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { initializeSocketIO } = require("./socket/socketManager");
const { PORT } = require("./config/constants");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
const publicPath = path.join(__dirname, "..", "public");
console.log(`[SERVER] Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Initialize Socket.IO event handlers
initializeSocketIO(io);

// Start server
server.listen(PORT, () => {
  console.log(`[SERVER] Server running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, server, io };
