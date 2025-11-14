/**
 * @fileoverview Message History storage
 * Manages message history for rooms, private chats, and groups
 */

/**
 * MessageHistory class for storing and retrieving chat messages
 */
class MessageHistory {
  /**
   * Create a new message history storage
   */
  constructor() {
    /** @type {Map<string, Array>} Room messages */
    this.roomMessages = new Map();

    /** @type {Map<string, Array>} Private messages */
    this.privateMessages = new Map();

    /** @type {Map<string, Array>} Group messages */
    this.groupMessages = new Map();
  }

  /**
   * Add a message to room history
   * @param {string} room - Room name
   * @param {Object} message - Message object
   */
  addRoomMessage(room, message) {
    if (!this.roomMessages.has(room)) {
      this.roomMessages.set(room, []);
    }
    this.roomMessages.get(room).push(message);
  }

  /**
   * Add a message to private chat history
   * @param {string} user1 - First username
   * @param {string} user2 - Second username
   * @param {Object} message - Message object
   */
  addPrivateMessage(user1, user2, message) {
    const key = [user1, user2].sort().join("_pm_");
    if (!this.privateMessages.has(key)) {
      this.privateMessages.set(key, []);
    }
    this.privateMessages.get(key).push(message);
  }

  /**
   * Add a message to group history
   * @param {string} groupName - Group name
   * @param {Object} message - Message object
   */
  addGroupMessage(groupName, message) {
    if (!this.groupMessages.has(groupName)) {
      this.groupMessages.set(groupName, []);
    }
    this.groupMessages.get(groupName).push(message);
  }

  /**
   * Get room messages after a specific time
   * @param {string} room - Room name
   * @param {number} afterTime - Timestamp to filter messages after
   * @returns {Array} Filtered messages
   */
  getRoomMessages(room, afterTime = 0) {
    const messages = this.roomMessages.get(room) || [];
    return messages.filter((msg) => msg._timestamp >= afterTime);
  }

  /**
   * Get private chat messages (no time filtering for private chats)
   * @param {string} user1 - First username
   * @param {string} user2 - Second username
   * @returns {Array} All private messages between users
   */
  getPrivateMessages(user1, user2) {
    const key = [user1, user2].sort().join("_pm_");
    return this.privateMessages.get(key) || [];
  }

  /**
   * Get group messages after a specific time
   * @param {string} groupName - Group name
   * @param {number} afterTime - Timestamp to filter messages after
   * @returns {Array} Filtered messages
   */
  getGroupMessages(groupName, afterTime = 0) {
    const messages = this.groupMessages.get(groupName) || [];
    return messages.filter((msg) => msg._timestamp >= afterTime);
  }

  /**
   * Clear all message history
   */
  clear() {
    this.roomMessages.clear();
    this.privateMessages.clear();
    this.groupMessages.clear();
  }
}

module.exports = MessageHistory;
