/**
 * @fileoverview Chat utility functions
 * Helper functions for chat operations and ID generation
 */

import { getCurrentChat } from "../core/state.js";

/**
 * Generate unique chat ID based on chat type and participants
 * @param {Object} chat - Chat state object
 * @param {'room'|'private'|'group'} chat.type - Type of chat
 * @param {string} chat.name - Chat name
 * @param {string} [chat.target] - Target username for private chats
 * @returns {string} Unique chat identifier
 */
export function getChatId(chat) {
  if (chat.type === "room") {
    return `room_${chat.name}`;
  } else if (chat.type === "private") {
    return `${chat.target}_pm`;
  } else if (chat.type === "group") {
    return `group_${chat.name}`;
  }
  return "";
}

/**
 * Get the current chat ID
 * @returns {string} Current chat identifier
 */
export function getCurrentChatId() {
  return getChatId(getCurrentChat());
}
