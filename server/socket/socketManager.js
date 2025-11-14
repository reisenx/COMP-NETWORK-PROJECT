/**
 * @fileoverview Socket.IO manager
 * Initializes Socket.IO and attaches all event handlers
 */

const {
  handleJoinRoom,
  handleDisconnect,
} = require("./handlers/connectionHandler");
const { handleChatMessage } = require("./handlers/roomHandler");
const {
  handlePrivateMessage,
  handleRequestPrivateHistory,
} = require("./handlers/privateHandler");
const {
  handleCreateGroup,
  handleRequestGroups,
  handleJoinGroup,
  handleGroupMessage,
  handleRequestGroupHistory,
} = require("./handlers/groupHandler");
const { handleChangeTheme } = require("./handlers/themeHandler");

/**
 * Initialize Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 */
function initializeSocketIO(io) {
  io.on("connection", (socket) => {
    console.log(`[SOCKET] New connection: ${socket.id}`);

    // Connection events
    socket.on("joinRoom", (data) => handleJoinRoom(socket, io, data));
    socket.on("disconnect", () => handleDisconnect(socket, io));

    // Room chat events
    socket.on("chatMessage", (msg) => handleChatMessage(socket, io, msg));

    // Private message events (R7)
    socket.on("privateMessage", (data) =>
      handlePrivateMessage(socket, io, data)
    );
    socket.on("requestPrivateHistory", (data) =>
      handleRequestPrivateHistory(socket, data)
    );

    // Group events (R8-R11)
    socket.on("createGroup", (data) => handleCreateGroup(socket, io, data));
    socket.on("requestGroups", () => handleRequestGroups(socket));
    socket.on("joinGroup", (data) => handleJoinGroup(socket, io, data));
    socket.on("groupMessage", (data) => handleGroupMessage(socket, io, data));
    socket.on("requestGroupHistory", (data) =>
      handleRequestGroupHistory(socket, data)
    );

    // Theme events
    socket.on("changeTheme", (data) => handleChangeTheme(socket, data));
  });

  console.log("[SOCKET] Socket.IO initialized with all event handlers");
}

module.exports = {
  initializeSocketIO,
};
