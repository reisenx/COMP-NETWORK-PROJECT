/**
 * @fileoverview Socket.IO client connection manager
 * Exports socket instance and initialization function
 */

/**
 * Socket.IO client instance
 * @type {SocketIOClient.Socket}
 */
export const socket = io();

/**
 * Initialize socket connection and attach all event handlers
 * @param {string} username - Current user's username
 * @param {string} room - Current room name
 */
export function initializeSocket(username, room) {
  // Import and call connection handler
  import("./handlers/connectionHandler.js").then((module) => {
    module.initializeConnection(socket, username, room);
  });
}

export default socket;
