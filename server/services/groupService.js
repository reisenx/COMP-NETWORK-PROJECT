/**
 * @fileoverview Group service
 * Manages chat groups and memberships
 */

const Group = require("../models/Group");

/** @type {Map<string, Group>} Map of group name to Group object */
const groups = new Map();

/**
 * Create a new group
 * @param {string} groupName - Group name
 * @param {string} creatorUsername - Creator's username
 * @param {string} creatorId - Creator's socket ID
 * @returns {Object} Result object with group and joinTime or error
 */
function createGroup(groupName, creatorUsername, creatorId) {
  if (!groupName || groupName.trim() === "") {
    return { error: "Group name cannot be empty" };
  }

  if (groups.has(groupName)) {
    return { error: `Group "${groupName}" already exists` };
  }

  const group = new Group(groupName, creatorUsername, creatorId);
  groups.set(groupName, group);

  return {
    group: group.toDetailedJSON(),
    joinTime: Date.now(),
  };
}

/**
 * Get all groups with member information
 * @returns {Array<Object>} Array of group info objects
 */
function getAllGroups() {
  return Array.from(groups.values()).map((group) => group.toJSON());
}

/**
 * Get a specific group
 * @param {string} groupName - Group name
 * @returns {Group|undefined} Group object or undefined
 */
function getGroup(groupName) {
  return groups.get(groupName);
}

/**
 * Join an existing group
 * @param {string} groupName - Group name
 * @param {string} username - Username joining
 * @param {string} socketId - Socket ID
 * @returns {Object} Result object with group and joinTime or error
 */
function joinGroup(groupName, username, socketId) {
  const group = groups.get(groupName);

  if (!group) {
    return { error: `Group "${groupName}" does not exist` };
  }

  // Check if user is already a member
  if (group.hasMember(socketId)) {
    return { error: "You are already a member of this group" };
  }

  const member = group.addMember(username, socketId);

  return {
    group: group.toDetailedJSON(),
    joinTime: member.joinTime,
  };
}

/**
 * Leave a group
 * @param {string} groupName - Group name
 * @param {string} socketId - Socket ID
 * @returns {boolean} True if user was removed
 */
function leaveGroup(groupName, socketId) {
  const group = groups.get(groupName);
  if (!group) return false;

  const removed = group.removeMember(socketId);

  // Delete group if no members left
  if (group.members.length === 0) {
    groups.delete(groupName);
  }

  return removed;
}

/**
 * Get all members of a group
 * @param {string} groupName - Group name
 * @returns {Array} Array of member objects
 */
function getGroupMembers(groupName) {
  const group = groups.get(groupName);
  return group ? group.members : [];
}

/**
 * Check if a socket ID is a member of a group
 * @param {string} groupName - Group name
 * @param {string} socketId - Socket ID
 * @returns {boolean} True if member of group
 */
function isGroupMember(groupName, socketId) {
  const group = groups.get(groupName);
  return group ? group.hasMember(socketId) : false;
}

module.exports = {
  createGroup,
  getAllGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  isGroupMember,
};
