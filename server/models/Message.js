/**
 * @fileoverview Message model
 * Represents a chat message with timestamp
 */

const moment = require("moment");

/**
 * Message class representing a chat message
 */
class Message {
  /**
   * Create a new message
   * @param {string} username - Sender's username
   * @param {string} text - Message content
   * @param {number} [timestamp=Date.now()] - Message timestamp in milliseconds
   */
  constructor(username, text, timestamp = Date.now()) {
    this.username = username;
    this.message = text;
    this._timestamp = timestamp;
    this.timestamp = moment(timestamp).format("h:mm a");
  }

  /**
   * Get message as plain object
   * @returns {Object} Message data
   */
  toJSON() {
    return {
      username: this.username,
      message: this.message,
      timestamp: this.timestamp,
      _timestamp: this._timestamp,
    };
  }
}

module.exports = Message;
