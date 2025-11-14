/**
 * @fileoverview Active chats list UI module
 * Handles displaying and updating the active chats sidebar
 */

import { getRoom, activeChats, getCurrentChat } from "../../core/state.js";
import { CHAT_TYPES } from "../../config/constants.js";
import { updateUnreadBadges } from "../notifications/unreadCounter.js";

/**
 * Update the active chats list in the sidebar
 * Displays all active conversations (room, private, and group chats)
 * Highlights the currently active chat
 * @param {Function} onSwitchToRoom - Callback for switching to room chat
 * @param {Function} onSwitchToPrivate - Callback for switching to private chat
 * @param {Function} onSwitchToGroup - Callback for switching to group chat
 */
export function updateActiveChatsList(
  onSwitchToRoom,
  onSwitchToPrivate,
  onSwitchToGroup
) {
  const activeChatsList = document.getElementById("active-chats");
  if (!activeChatsList) return;

  activeChatsList.innerHTML = "";
  const room = getRoom();
  const currentChat = getCurrentChat();

  // Add room chat
  const roomLi = document.createElement("li");
  const roomText = document.createTextNode(`Room: ${room}`);
  roomLi.appendChild(roomText);
  roomLi.classList.add("active-chat-item");
  roomLi.setAttribute("data-chat-id", `room_${room}`);
  roomLi.style.cursor = "pointer";
  if (currentChat.type === CHAT_TYPES.ROOM) {
    roomLi.style.backgroundColor = "rgba(255,255,255,0.2)";
  }
  roomLi.addEventListener("click", () => {
    if (onSwitchToRoom) onSwitchToRoom();
  });
  activeChatsList.appendChild(roomLi);

  // Add private chats
  activeChats.forEach((chatData, chatId) => {
    if (chatData.type === CHAT_TYPES.PRIVATE) {
      const li = document.createElement("li");
      const text = document.createTextNode(`Private: ${chatData.name}`);
      li.appendChild(text);
      li.classList.add("active-chat-item");
      li.setAttribute("data-chat-id", chatId);
      li.style.cursor = "pointer";
      if (
        currentChat.type === CHAT_TYPES.PRIVATE &&
        currentChat.target === chatData.name
      ) {
        li.style.backgroundColor = "rgba(255,255,255,0.2)";
      }
      li.addEventListener("click", () => {
        if (onSwitchToPrivate) onSwitchToPrivate(chatData.name);
      });
      activeChatsList.appendChild(li);
    }
  });

  // Add group chats
  activeChats.forEach((chatData, chatId) => {
    if (chatData.type === CHAT_TYPES.GROUP) {
      const li = document.createElement("li");
      const text = document.createTextNode(`Group: ${chatData.name}`);
      li.appendChild(text);
      li.classList.add("active-chat-item");
      li.setAttribute("data-chat-id", chatId);
      li.style.cursor = "pointer";
      if (
        currentChat.type === CHAT_TYPES.GROUP &&
        currentChat.name === chatData.name
      ) {
        li.style.backgroundColor = "rgba(255,255,255,0.2)";
      }
      li.addEventListener("click", () => {
        if (onSwitchToGroup) onSwitchToGroup(chatData.name);
      });
      activeChatsList.appendChild(li);
    }
  });

  // Update badges after adding all items
  setTimeout(() => updateUnreadBadges(), 0);
}
