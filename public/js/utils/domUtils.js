/**
 * @fileoverview DOM utility functions
 * Helper functions for DOM manipulation and element access
 */

import { DOM } from "../config/constants.js";

/**
 * Get chat messages container element
 * @returns {HTMLElement} Chat messages container
 */
export function getChatMessagesElement() {
  return document.querySelector(DOM.CHAT_MESSAGES);
}

/**
 * Get chat form element
 * @returns {HTMLFormElement} Chat form
 */
export function getChatFormElement() {
  return document.getElementById(DOM.CHAT_FORM);
}

/**
 * Get room name display element
 * @returns {HTMLElement} Room name element
 */
export function getRoomNameElement() {
  return document.getElementById(DOM.ROOM_NAME);
}

/**
 * Get room users list element
 * @returns {HTMLElement} Room users list
 */
export function getRoomUserListElement() {
  return document.getElementById(DOM.ROOM_USER_LIST);
}

/**
 * Get all users list element
 * @returns {HTMLElement} All users list
 */
export function getAllUserListElement() {
  return document.getElementById(DOM.ALL_USER_LIST);
}

/**
 * Get groups list element
 * @returns {HTMLElement} Groups list
 */
export function getGroupsListElement() {
  return document.getElementById(DOM.GROUPS_LIST);
}

/**
 * Get active chats list element
 * @returns {HTMLElement} Active chats list
 */
export function getActiveChatListElement() {
  return document.getElementById(DOM.ACTIVE_CHATS);
}

/**
 * Get current chat type display element
 * @returns {HTMLElement} Current chat type element
 */
export function getCurrentChatTypeElement() {
  return document.getElementById(DOM.CURRENT_CHAT_TYPE);
}

/**
 * Get current chat name display element
 * @returns {HTMLElement} Current chat name element
 */
export function getCurrentChatNameElement() {
  return document.getElementById(DOM.CURRENT_CHAT_NAME);
}

/**
 * Clear all child elements from a container
 * @param {HTMLElement} element - Container element to clear
 */
export function clearElement(element) {
  if (element) {
    element.innerHTML = "";
  }
}

/**
 * Scroll element to bottom
 * @param {HTMLElement} element - Element to scroll
 */
export function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}
