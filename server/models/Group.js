/**
 * @fileoverview Group model
 * Represents a chat group with members
 */

/**
 * Group class representing a chat group
 */
class Group {
  /**
   * Create a new group
   * @param {string} name - Group name
   * @param {string} creatorUsername - Username of the creator
   * @param {string} creatorId - Socket ID of the creator
   */
  constructor(name, creatorUsername, creatorId) {
    this.name = name;
    this.members = [
      {
        username: creatorUsername,
        id: creatorId,
        joinTime: Date.now(),
      },
    ];
  }

  /**
   * Add a member to the group
   * @param {string} username - Username to add
   * @param {string} id - Socket ID
   * @returns {Object} Member object that was added
   */
  addMember(username, id) {
    const member = {
      username,
      id,
      joinTime: Date.now(),
    };
    this.members.push(member);
    return member;
  }

  /**
   * Remove a member from the group
   * @param {string} id - Socket ID to remove
   * @returns {boolean} True if member was removed
   */
  removeMember(id) {
    const initialLength = this.members.length;
    this.members = this.members.filter((m) => m.id !== id);
    return this.members.length < initialLength;
  }

  /**
   * Check if a socket ID is a member
   * @param {string} id - Socket ID to check
   * @returns {boolean} True if member exists
   */
  hasMember(id) {
    return this.members.some((m) => m.id === id);
  }

  /**
   * Get member by socket ID
   * @param {string} id - Socket ID
   * @returns {Object|undefined} Member object or undefined
   */
  getMember(id) {
    return this.members.find((m) => m.id === id);
  }

  /**
   * Get group info as plain object
   * @returns {Object} Group data with member count
   */
  toJSON() {
    return {
      name: this.name,
      members: this.members.map((m) => m.username),
      memberCount: this.members.length,
    };
  }

  /**
   * Get detailed group info including join times
   * @returns {Object} Detailed group data
   */
  toDetailedJSON() {
    return {
      name: this.name,
      members: this.members,
      memberCount: this.members.length,
    };
  }
}

module.exports = Group;
