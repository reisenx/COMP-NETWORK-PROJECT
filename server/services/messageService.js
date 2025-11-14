/**
 * @fileoverview Message service
 * Creates and formats messages
 */

const Message = require("../models/Message");

/**
 * Create a formatted message
 * @param {string} username - Sender's username
 * @param {string} text - Message content
 * @returns {Object} Formatted message object
 */
function formatMessage(username, text) {
  const message = new Message(username, text);
  return message.toJSON();
}

module.exports = {
  formatMessage,
};
