/**
 * @fileoverview Server configuration constants
 * Contains server-side configuration values and settings
 */

/**
 * Server configuration
 * @namespace ServerConfig
 */
module.exports = {
  /**
   * Server port number
   * Uses environment variable PORT or defaults to 3000
   * @type {number}
   */
  PORT: process.env.PORT || 3000,

  /**
   * Bot username for system messages
   * @type {string}
   */
  BOT_NAME: "Slave Bot",

  /**
   * Valid theme options
   * @type {string[]}
   */
  VALID_THEMES: ["light", "dark"],

  /**
   * Default theme for new users
   * @type {string}
   */
  DEFAULT_THEME: "light",

  /**
   * Socket.IO room prefix for groups
   * @type {string}
   */
  GROUP_ROOM_PREFIX: "group_",

  /**
   * Private message room separator
   * @type {string}
   */
  PRIVATE_ROOM_SEPARATOR: "_pm_",
};
