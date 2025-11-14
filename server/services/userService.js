/**
 * @fileoverview User service
 * Manages connected users and theme preferences
 */

const User = require("../models/User");
const { DEFAULT_THEME } = require("../config/constants");

/** @type {User[]} Array of connected users */
const users = [];

/** @type {Map<string, string>} User theme preferences (username -> theme) */
const userThemes = new Map();

/**
 * Add a user to the chat
 * Handles removing duplicate socket IDs and usernames
 * @param {string} id - Socket ID
 * @param {string} username - Username
 * @param {string} room - Room name
 * @returns {User|Object} User object or error object
 */
function userJoin(id, username, room) {
  // Remove any existing user with the same socket ID
  const indexById = users.findIndex((user) => user.id === id);
  if (indexById !== -1) {
    users.splice(indexById, 1);
  }

  // Check for duplicate username
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return {
      error: `Username "${username}" is already taken. Please choose a different name.`,
    };
  }

  // Create and add new user
  const user = new User(id, username, room);
  users.push(user);
  return user;
}

/**
 * Get current user by socket ID
 * @param {string} id - Socket ID
 * @returns {User|undefined} User object or undefined
 */
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

/**
 * Remove a user from the chat
 * @param {string} id - Socket ID
 * @returns {User|undefined} Removed user or undefined
 */
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

/**
 * Get all users in a specific room
 * @param {string} room - Room name
 * @returns {User[]} Array of users in the room
 */
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

/**
 * Get all connected users
 * @returns {User[]} Array of all users
 */
function getAllUsers() {
  return users;
}

/**
 * Set user theme preference
 * @param {string} username - Username
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function setUserTheme(username, theme) {
  userThemes.set(username, theme);
}

/**
 * Get user theme preference
 * @param {string} username - Username
 * @returns {string} Theme name or default theme
 */
function getUserTheme(username) {
  return userThemes.get(username) || DEFAULT_THEME;
}

/**
 * Check if user has a saved theme preference
 * @param {string} username - Username
 * @returns {boolean} True if user has saved theme
 */
function hasUserTheme(username) {
  return userThemes.has(username);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
  setUserTheme,
  getUserTheme,
  hasUserTheme,
};
