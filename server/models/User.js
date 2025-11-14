/**
 * @fileoverview User model
 * Represents a connected user in the chat application
 */

/**
 * User class representing a connected chat user
 */
class User {
  /**
   * Create a new user
   * @param {string} id - Socket ID
   * @param {string} username - Username
   * @param {string} room - Room name
   * @param {number} [joinTime=Date.now()] - Timestamp when user joined
   */
  constructor(id, username, room, joinTime = Date.now()) {
    this.id = id;
    this.username = username;
    this.room = room;
    this.joinTime = joinTime;
  }

  /**
   * Get user information as plain object
   * @returns {Object} User data
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      room: this.room,
      joinTime: this.joinTime,
    };
  }
}

module.exports = User;
