/**
 * @fileoverview Room handler
 * Handles room chat messages
 */

const { getCurrentUser } = require("../../services/userService");
const { addRoomMessage } = require("../../services/historyService");

/**
 * Handle room chat message
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {string} msg - Message text
 */
function handleChatMessage(socket, io, msg) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("joinError", "You are not in a room");
    return;
  }

  const formattedMessage = addRoomMessage(user.room, user.username, msg);
  io.to(user.room).emit("message", formattedMessage);
}

module.exports = {
  handleChatMessage,
};
