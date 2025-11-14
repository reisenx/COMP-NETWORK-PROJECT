/**
 * @fileoverview Application state management
 * Centralized state for chat application including current chat, active chats, and user data
 */

import { CHAT_TYPES } from "../config/constants.js";

/**
 * Message object structure
 * @typedef {Object} Message
 * @property {string} username - Sender's username
 * @property {string} message - Message content
 * @property {string} timestamp - Formatted timestamp (e.g., "3:45 pm")
 * @property {number} [_timestamp] - Internal timestamp in milliseconds
 */

/**
 * Chat state object
 * @typedef {Object} ChatState
 * @property {'room'|'private'|'group'} type - Type of chat
 * @property {string} name - Display name of the chat
 * @property {string|null} target - Target username for private chats
 */

/**
 * Chat data structure
 * @typedef {Object} ChatData
 * @property {'room'|'private'|'group'} type - Type of chat
 * @property {string} name - Name of the chat
 * @property {Message[]} messages - Array of messages in this chat
 */

/**
 * Current user's username and room parsed from URL query parameters
 * @type {{username: string, room: string}}
 */
const urlParams = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

export const username = urlParams.username;
export const room = urlParams.room;

/**
 * Current active chat state tracking
 * @type {ChatState}
 */
export let currentChat = {
  type: CHAT_TYPES.ROOM,
  name: room,
  target: null,
};

/**
 * Store active chats with their message history
 * @type {Map<string, ChatData>}
 */
export const activeChats = new Map();

/**
 * Track which groups the current user is a member of
 * @type {Set<string>}
 */
export const userGroups = new Set();

/**
 * Update current chat state
 * @param {ChatState} newChat - New chat state
 */
export function setCurrentChat(newChat) {
  currentChat = newChat;
}

/**
 * Get current chat state
 * @returns {ChatState} Current chat state
 */
export function getCurrentChat() {
  return currentChat;
}

/**
 * Get current username
 * @returns {string} Current username
 */
export function getUsername() {
  return username;
}

/**
 * Get current room
 * @returns {string} Current room name
 */
export function getRoom() {
  return room;
}

/**
 * Add a chat to active chats
 * @param {string} chatId - Unique chat identifier
 * @param {ChatData} chatData - Chat data object
 */
export function addActiveChat(chatId, chatData) {
  activeChats.set(chatId, chatData);
}

/**
 * Get a chat from active chats
 * @param {string} chatId - Unique chat identifier
 * @returns {ChatData|undefined} Chat data or undefined if not found
 */
export function getActiveChat(chatId) {
  return activeChats.get(chatId);
}

/**
 * Check if a chat exists in active chats
 * @param {string} chatId - Unique chat identifier
 * @returns {boolean} True if chat exists
 */
export function hasActiveChat(chatId) {
  return activeChats.has(chatId);
}

/**
 * Add a group to user's groups
 * @param {string} groupName - Group name
 */
export function addUserGroup(groupName) {
  userGroups.add(groupName);
}

/**
 * Remove a group from user's groups
 * @param {string} groupName - Group name
 */
export function removeUserGroup(groupName) {
  userGroups.delete(groupName);
}

/**
 * Check if user is a member of a group
 * @param {string} groupName - Group name
 * @returns {boolean} True if user is a member
 */
export function isUserInGroup(groupName) {
  return userGroups.has(groupName);
}
