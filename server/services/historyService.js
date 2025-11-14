/**
 * @fileoverview History service
 * Manages message history for rooms, private chats, and groups
 */

const MessageHistory = require("../models/MessageHistory");
const { formatMessage } = require("./messageService");

/** @type {MessageHistory} Singleton message history instance */
const messageHistory = new MessageHistory();

/**
 * Add a message to room history
 * @param {string} room - Room name
 * @param {string} username - Sender's username
 * @param {string} text - Message content
 * @returns {Object} Formatted message object
 */
function addRoomMessage(room, username, text) {
  const message = formatMessage(username, text);
  messageHistory.addRoomMessage(room, message);
  return message;
}

/**
 * Add a private message to history
 * @param {string} fromUser - Sender's username
 * @param {string} toUser - Recipient's username
 * @param {string} senderUsername - Actual sender username for message
 * @param {string} text - Message content
 * @returns {Object} Formatted message object
 */
function addPrivateMessage(fromUser, toUser, senderUsername, text) {
  const message = formatMessage(senderUsername, text);
  messageHistory.addPrivateMessage(fromUser, toUser, message);
  return message;
}

/**
 * Add a group message to history
 * @param {string} groupName - Group name
 * @param {string} username - Sender's username
 * @param {string} text - Message content
 * @returns {Object} Formatted message object
 */
function addGroupMessage(groupName, username, text) {
  const message = formatMessage(username, text);
  messageHistory.addGroupMessage(groupName, message);
  return message;
}

/**
 * Get room message history after a specific time
 * @param {string} room - Room name
 * @param {number} afterTime - Timestamp to filter messages after
 * @returns {Array} Array of messages
 */
function getRoomHistory(room, afterTime = 0) {
  return messageHistory.getRoomMessages(room, afterTime);
}

/**
 * Get private chat history (no time filtering)
 * @param {string} user1 - First username
 * @param {string} user2 - Second username
 * @returns {Array} Array of all private messages
 */
function getPrivateHistory(user1, user2) {
  return messageHistory.getPrivateMessages(user1, user2);
}

/**
 * Get group message history after a specific time
 * @param {string} groupName - Group name
 * @param {number} afterTime - Timestamp to filter messages after
 * @returns {Array} Array of messages
 */
function getGroupHistory(groupName, afterTime = 0) {
  return messageHistory.getGroupMessages(groupName, afterTime);
}

module.exports = {
  addRoomMessage,
  addPrivateMessage,
  addGroupMessage,
  getRoomHistory,
  getPrivateHistory,
  getGroupHistory,
};
