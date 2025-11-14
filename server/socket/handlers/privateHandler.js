/**
 * @fileoverview Private message handler
 * Handles private/direct messaging between users (R7)
 */

const { getCurrentUser, getAllUsers } = require("../../services/userService");
const {
  addPrivateMessage,
  getPrivateHistory,
} = require("../../services/historyService");
const { PRIVATE_ROOM_SEPARATOR } = require("../../config/constants");

/**
 * Handle private message
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Object} data - Private message data
 * @param {string} data.toUsername - Recipient username (note: server.js uses 'toUsername', not 'to')
 * @param {string} data.message - Message text
 */
function handlePrivateMessage(socket, io, { toUsername, message }) {
  const sender = getCurrentUser(socket.id);

  if (!sender) {
    socket.emit("joinError", "You are not in a room");
    return;
  }

  const allUsers = getAllUsers();
  const receiver = allUsers.find((u) => u.username === toUsername);

  if (!receiver) {
    socket.emit("privateMessageError", `User ${toUsername} is not online`);
    return;
  }

  if (receiver.username === sender.username) {
    socket.emit("privateMessageError", "You cannot send a message to yourself");
    return;
  }

  // Create private room name (sorted for consistency)
  const privateRoom = [sender.username, receiver.username]
    .sort()
    .join(PRIVATE_ROOM_SEPARATOR);

  // Save message to history
  const formattedMessage = addPrivateMessage(
    sender.username,
    receiver.username,
    sender.username,
    message
  );

  // Send to receiver
  io.to(receiver.id).emit("privateMessage", {
    from: sender.username,
    message: formattedMessage,
    room: privateRoom,
  });

  // Send confirmation to sender
  socket.emit("privateMessage", {
    from: sender.username,
    to: receiver.username,
    message: formattedMessage,
    room: privateRoom,
  });
}

/**
 * Handle request for private chat history
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Request data
 * @param {string} data.otherUsername - Other user's username
 */
function handleRequestPrivateHistory(socket, { otherUsername }) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("joinError", "You are not in a room");
    return;
  }

  // Private chats show ALL messages (no filtering by join time)
  const history = getPrivateHistory(user.username, otherUsername);
  socket.emit("privateHistory", {
    otherUsername,
    messages: history,
  });
}

module.exports = {
  handlePrivateMessage,
  handleRequestPrivateHistory,
};
