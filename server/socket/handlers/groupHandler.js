/**
 * @fileoverview Group handler
 * Handles group creation, joining, and messaging (R8-R11)
 */

const { getCurrentUser, getAllUsers } = require("../../services/userService");
const {
  createGroup,
  getAllGroups,
  joinGroup,
  isGroupMember,
  getGroup,
} = require("../../services/groupService");
const {
  addGroupMessage,
  getGroupHistory,
} = require("../../services/historyService");
const { GROUP_ROOM_PREFIX } = require("../../config/constants");

/**
 * Handle create group request (R8)
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Object} data - Create group data
 * @param {string} data.groupName - Name of the group to create
 */
function handleCreateGroup(socket, io, { groupName }) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("groupError", "You are not in a room");
    return;
  }

  const result = createGroup(groupName, user.username, socket.id);

  if (result.error) {
    socket.emit("groupError", result.error);
    return;
  }

  // Join socket to group room
  socket.join(`${GROUP_ROOM_PREFIX}${result.group.name}`);

  // Notify all clients about the new group
  io.emit("allGroups", { groups: getAllGroups() });

  socket.emit("groupCreated", {
    group: result.group,
    joinTime: result.joinTime,
  });
}

/**
 * Handle request for all groups (R9)
 * @param {Socket} socket - Socket.IO socket instance
 */
function handleRequestGroups(socket) {
  socket.emit("allGroups", { groups: getAllGroups() });
}

/**
 * Handle join group request (R10)
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Object} data - Join group data
 * @param {string} data.groupName - Name of the group to join
 */
function handleJoinGroup(socket, io, { groupName }) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("groupError", "You are not in a room");
    return;
  }

  const result = joinGroup(groupName, user.username, socket.id);

  if (result.error) {
    socket.emit("groupError", result.error);
    return;
  }

  // Join socket to group room
  socket.join(`${GROUP_ROOM_PREFIX}${result.group.name}`);

  // Notify group members
  result.group.members.forEach((member) => {
    const memberUser = getAllUsers().find(
      (u) => u.username === member.username
    );
    if (memberUser) {
      io.to(memberUser.id).emit("groupJoined", {
        groupName: result.group.name,
        username: user.username,
      });
    }
  });

  // Update all clients with group list
  io.emit("allGroups", { groups: getAllGroups() });

  socket.emit("groupJoinedSuccess", {
    group: result.group,
    joinTime: result.joinTime,
  });
}

/**
 * Handle group message (R11)
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Object} data - Group message data
 * @param {string} data.groupName - Name of the group
 * @param {string} data.message - Message text
 */
function handleGroupMessage(socket, io, { groupName, message }) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("groupError", "You are not in a room");
    return;
  }

  if (!isGroupMember(groupName, socket.id)) {
    socket.emit("groupError", "You are not a member of this group");
    return;
  }

  // Save message to history
  const formattedMessage = addGroupMessage(groupName, user.username, message);

  // Send message to all group members
  io.to(`${GROUP_ROOM_PREFIX}${groupName}`).emit("groupMessage", {
    groupName,
    message: formattedMessage,
  });
}

/**
 * Handle request for group history
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Request data
 * @param {string} data.groupName - Name of the group
 */
function handleRequestGroupHistory(socket, { groupName }) {
  const user = getCurrentUser(socket.id);

  if (!user) {
    socket.emit("groupError", "You are not in a room");
    return;
  }

  if (!isGroupMember(groupName, socket.id)) {
    socket.emit("groupError", "You are not a member of this group");
    return;
  }

  // Get user's join time for this group
  const group = getGroup(groupName);
  const member = group.members.find((m) => m.id === socket.id);
  const joinTime = member ? member.joinTime || Date.now() : Date.now();

  // Only get messages sent after user joined the group
  const history = getGroupHistory(groupName, joinTime);
  socket.emit("groupHistory", {
    groupName,
    messages: history,
  });
}

module.exports = {
  handleCreateGroup,
  handleRequestGroups,
  handleJoinGroup,
  handleGroupMessage,
  handleRequestGroupHistory,
};
