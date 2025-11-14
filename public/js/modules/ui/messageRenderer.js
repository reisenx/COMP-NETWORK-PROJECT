/**
 * @fileoverview Message rendering UI module
 * Handles displaying messages in the chat window
 */

import { getChatMessagesElement } from "../../utils/domUtils.js";

/**
 * Display a message in the chat window
 * Creates and appends a message div with username, timestamp, and content
 * @param {Object} message - Message object to display
 * @param {string} message.username - Sender's username
 * @param {string} message.message - Message content
 * @param {string} message.timestamp - Formatted timestamp
 */
export function outputMessage(message) {
  const chatMessages = getChatMessagesElement();
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.timestamp}</span> </p>
    <p class="text">
    ${message.message}
    </p>`;
  chatMessages.appendChild(div);
}

/**
 * Clear all messages from chat window
 */
export function clearMessages() {
  const chatMessages = getChatMessagesElement();
  if (chatMessages) {
    chatMessages.innerHTML = "";
  }
}

/**
 * Scroll chat messages to bottom
 */
export function scrollToBottom() {
  const chatMessages = getChatMessagesElement();
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Display multiple messages
 * @param {Array<Object>} messages - Array of message objects
 */
export function outputMessages(messages) {
  clearMessages();
  messages.forEach((msg) => outputMessage(msg));
  scrollToBottom();
}
