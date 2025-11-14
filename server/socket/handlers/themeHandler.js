/**
 * @fileoverview Theme handler
 * Handles user theme preference changes
 */

const { getCurrentUser, setUserTheme } = require("../../services/userService");
const { VALID_THEMES } = require("../../config/constants");

/**
 * Handle theme change request
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Theme data
 * @param {string} data.theme - Theme name ('light' or 'dark')
 */
function handleChangeTheme(socket, { theme }) {
  const user = getCurrentUser(socket.id);

  if (user && VALID_THEMES.includes(theme)) {
    setUserTheme(user.username, theme);
    console.log(`[THEME] User ${user.username} changed theme to ${theme}`);

    // Confirm the change back to client
    socket.emit("themePreference", { theme });
  }
}

module.exports = {
  handleChangeTheme,
};
