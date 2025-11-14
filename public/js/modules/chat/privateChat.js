/**
 * @fileoverview Private chat module
 * Handles private messaging functionality and navigation
 */

import {
  setCurrentChat,
  activeChats,
  addActiveChat,
  hasActiveChat,
  getActiveChat,
} from "../../core/state.js";
import { CHAT_TYPES } from "../../config/constants.js";
import { getChatId } from "../../utils/chatUtils.js";
import { updateChatContext } from "../ui/chatContext.js";
import { clearMessages, outputMessages } from "../ui/messageRenderer.js";
import { clearUnreadCount } from "../notifications/unreadCounter.js";
import { updateActiveChatsList } from "../ui/activeChatList.js";
import { socket } from "../../core/socket.js";

/**
 * Switch to private chat with a specific user
 * Creates or opens existing private chat and loads history
 * @param {string} targetUsername - Username of the other participant
 */
export function switchToPrivateChat(targetUsername) {
  setCurrentChat({
    type: CHAT_TYPES.PRIVATE,
    name: `Private: ${targetUsername}`,
    target: targetUsername,
  });

  const chatId = getChatId({
    type: CHAT_TYPES.PRIVATE,
    name: `Private: ${targetUsername}`,
    target: targetUsername,
  });

  // Clear unread count when switching to this chat
  clearUnreadCount(chatId);

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.PRIVATE,
      name: targetUsername,
      messages: [],
    });

    // Update active chats list - we'll need to pass callbacks
    const updateCallback = () => {
      import("../ui/activeChatList.js").then((module) => {
        import("./roomChat.js").then((roomModule) => {
          import("./groupChat.js").then((groupModule) => {
            module.updateActiveChatsList(
              roomModule.switchToRoomChat,
              switchToPrivateChat,
              groupModule.switchToGroupChat
            );
          });
        });
      });
    };
    updateCallback();

    // Request history from server
    socket.emit("requestPrivateHistory", { otherUsername: targetUsername });
  } else {
    // Load from local cache first, then request from server to sync
    updateChatContext();
    loadPrivateHistory(targetUsername);
    socket.emit("requestPrivateHistory", { otherUsername: targetUsername });
  }

  updateChatContext();
}

/**
 * Load private chat history for a specific user
 * @param {string} targetUsername - Username of the other participant
 */
function loadPrivateHistory(targetUsername) {
  const chatId = `${targetUsername}_pm`;

  if (hasActiveChat(chatId)) {
    const chatData = getActiveChat(chatId);
    outputMessages(chatData.messages);
  }
}

/**
 * Send a private message to a specific user
 * @param {string} targetUsername - Recipient username
 * @param {string} message - Message text to send
 */
export function sendPrivateMessage(targetUsername, message) {
  socket.emit("privateMessage", {
    to: targetUsername,
    message: message,
  });
}
