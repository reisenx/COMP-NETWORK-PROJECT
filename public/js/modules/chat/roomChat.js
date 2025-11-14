/**
 * @fileoverview Room chat module
 * Handles room chat functionality and navigation
 */

import {
  setCurrentChat,
  getRoom,
  activeChats,
  getActiveChat,
  hasActiveChat,
} from "../../core/state.js";
import { CHAT_TYPES } from "../../config/constants.js";
import { getChatId } from "../../utils/chatUtils.js";
import { updateChatContext } from "../ui/chatContext.js";
import { outputMessages } from "../ui/messageRenderer.js";
import { clearUnreadCount } from "../notifications/unreadCounter.js";
import { socket } from "../../core/socket.js";

/**
 * Switch back to the main room chat
 * Clears unread count and loads room history
 */
export function switchToRoomChat() {
  const room = getRoom();

  setCurrentChat({
    type: CHAT_TYPES.ROOM,
    name: room,
    target: null,
  });

  // Clear unread count when switching to this chat
  const chatId = getChatId({ type: CHAT_TYPES.ROOM, name: room });
  clearUnreadCount(chatId);

  updateChatContext();
  loadRoomHistory();
}

/**
 * Load room chat history
 */
function loadRoomHistory() {
  const room = getRoom();
  const chatId = `room_${room}`;

  if (hasActiveChat(chatId)) {
    const chatData = getActiveChat(chatId);
    outputMessages(chatData.messages);
  }
}

/**
 * Send a message to the current room
 * @param {string} message - Message text to send
 */
export function sendRoomMessage(message) {
  socket.emit("chatMessage", message);
}
