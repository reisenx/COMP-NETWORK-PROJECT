/**
 * @fileoverview Chat context UI module
 * Handles updating the current chat context display
 */

import { getCurrentChat } from "../../core/state.js";
import { CHAT_TYPES } from "../../config/constants.js";

/**
 * Update the chat context display showing current chat type and name
 * Updates the UI elements showing which chat is currently active
 */
export function updateChatContext() {
  const currentChat = getCurrentChat();
  const currentChatType = document.getElementById("current-chat-type");
  const currentChatName = document.getElementById("current-chat-name");

  if (!currentChatType || !currentChatName) return;

  if (currentChat.type === CHAT_TYPES.ROOM) {
    currentChatType.textContent = "Room Chat";
    currentChatName.textContent = currentChat.name;
  } else if (currentChat.type === CHAT_TYPES.PRIVATE) {
    currentChatType.textContent = "Private Chat";
    currentChatName.textContent = currentChat.name;
  } else if (currentChat.type === CHAT_TYPES.GROUP) {
    currentChatType.textContent = "Group Chat";
    currentChatName.textContent = currentChat.name;
  }
}
