/**
 * @fileoverview Connection handler
 * Handles user connection, room joining, and disconnection events
 */

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
  hasUserTheme,
  getUserTheme,
  setUserTheme,
} = require("../../services/userService");
const {
  getAllGroups,
  leaveGroup,
  getGroup,
} = require("../../services/groupService");
const { formatMessage } = require("../../services/messageService");
const {
  addRoomMessage,
  getRoomHistory,
} = require("../../services/historyService");
const {
  BOT_NAME,
  DEFAULT_THEME,
  VALID_THEMES,
} = require("../../config/constants");

/**
 * Handle user joining a room
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Object} data - Join data
 * @param {string} data.username - Username
 * @param {string} data.room - Room name
 * @param {string} [data.theme] - Theme preference
 */
function handleJoinRoom(socket, io, { username, room, theme }) {
  // Attempt to join user
  const result = userJoin(socket.id, username, room);

  if (result && result.error) {
    socket.emit("joinError", result.error);
    return;
  }

  const user = result;
  let userTheme;

  // Handle theme preference
  if (hasUserTheme(user.username)) {
    userTheme = getUserTheme(user.username);
    console.log(`[THEME] User ${user.username} has saved theme: ${userTheme}`);
  } else {
    if (theme && VALID_THEMES.includes(theme)) {
      setUserTheme(user.username, theme);
      userTheme = theme;
      console.log(`[THEME] Setting new theme for ${user.username}: ${theme}`);
    } else {
      userTheme = DEFAULT_THEME;
      setUserTheme(user.username, userTheme);
      console.log(
        `[THEME] Setting default theme for ${user.username}: ${DEFAULT_THEME}`
      );
    }
  }

  // Join socket room
  socket.join(user.room);

  // Send room history
  const roomHistory = getRoomHistory(user.room, user.joinTime);
  if (roomHistory.length > 0) {
    socket.emit("roomHistory", { room: user.room, messages: roomHistory });
  }

  // Welcome message
  const welcomeMsg = formatMessage(BOT_NAME, "Welcome to ComNetwork Project");
  socket.emit("message", welcomeMsg);
  console.log(`${user.username} has joined the chat`);

  // Broadcast join message
  const joinMsg = formatMessage(
    BOT_NAME,
    `${user.username} has joined the chat`
  );
  socket.broadcast.to(user.room).emit("message", joinMsg);

  // Save join message to history
  addRoomMessage(user.room, BOT_NAME, `${user.username} has joined the chat`);

  // Send room users
  io.to(user.room).emit("roomUsers", {
    room: user.room,
    users: getRoomUsers(user.room),
  });

  // Send all users
  io.emit("allUsers", { users: getAllUsers() });

  // Send all groups
  socket.emit("allGroups", { groups: getAllGroups() });

  // Send theme preference
  socket.emit("themePreference", { theme: userTheme });
  console.log(
    `[THEME] Sent theme preference "${userTheme}" to user ${user.username}`
  );
}

/**
 * Handle user disconnection
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
function handleDisconnect(socket, io) {
  const user = userLeave(socket.id);
  if (!user) return;

  // Broadcast leave message
  io.to(user.room).emit(
    "message",
    formatMessage(BOT_NAME, `${user.username} has left the chat`)
  );

  // Update user lists
  io.to(user.room).emit("roomUsers", {
    room: user.room,
    users: getRoomUsers(user.room),
  });

  io.emit("allUsers", { users: getAllUsers() });

  // Remove user from all groups
  const allGroups = getAllGroups();
  allGroups.forEach((groupInfo) => {
    const group = getGroup(groupInfo.name);
    if (group && group.members.some((m) => m.id === socket.id)) {
      leaveGroup(groupInfo.name, socket.id);
    }
  });

  io.emit("allGroups", { groups: getAllGroups() });
}

module.exports = {
  handleJoinRoom,
  handleDisconnect,
};
