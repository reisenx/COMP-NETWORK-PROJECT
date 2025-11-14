/**
 * @fileoverview Group chat module
 * Handles group chat functionality and navigation
 */

import {
  setCurrentChat,
  activeChats,
  addActiveChat,
  hasActiveChat,
  getActiveChat,
  isUserInGroup,
  addUserGroup,
} from "../../core/state.js";
import { CHAT_TYPES } from "../../config/constants.js";
import { getChatId } from "../../utils/chatUtils.js";
import { updateChatContext } from "../ui/chatContext.js";
import { clearMessages, outputMessages } from "../ui/messageRenderer.js";
import { clearUnreadCount } from "../notifications/unreadCounter.js";
import { updateActiveChatsList } from "../ui/activeChatList.js";
import { socket } from "../../core/socket.js";

/**
 * Switch to a specific group chat
 * Checks membership, loads history, or triggers join if not a member
 * @param {string} groupName - Name of the group to switch to
 */
export function switchToGroupChat(groupName) {
  // Check if user is a member
  if (!isUserInGroup(groupName)) {
    alert("You are not a member of this group. Joining now...");
    socket.emit("joinGroup", { groupName: groupName });
    return; // Will switch after join success
  }

  setCurrentChat({
    type: CHAT_TYPES.GROUP,
    name: groupName,
    target: null,
  });

  const chatId = getChatId({ type: CHAT_TYPES.GROUP, name: groupName });

  // Clear unread count when switching to this chat
  clearUnreadCount(chatId);

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.GROUP,
      name: groupName,
      messages: [],
    });

    // Update active chats list
    const updateCallback = () => {
      import("../ui/activeChatList.js").then((module) => {
        import("./roomChat.js").then((roomModule) => {
          import("./privateChat.js").then((privateModule) => {
            module.updateActiveChatsList(
              roomModule.switchToRoomChat,
              privateModule.switchToPrivateChat,
              switchToGroupChat
            );
          });
        });
      });
    };
    updateCallback();

    // Request history from server
    socket.emit("requestGroupHistory", { groupName: groupName });
  } else {
    // Load from local cache first, then request from server to sync
    updateChatContext();
    loadGroupHistory(groupName);
    socket.emit("requestGroupHistory", { groupName: groupName });
  }

  updateChatContext();
}

/**
 * Load group chat history
 * @param {string} groupName - Name of the group
 */
function loadGroupHistory(groupName) {
  const chatId = `group_${groupName}`;

  if (hasActiveChat(chatId)) {
    const chatData = getActiveChat(chatId);
    outputMessages(chatData.messages);
  }
}

/**
 * Create a new group
 * @param {string} groupName - Name for the new group
 */
export function createGroup(groupName) {
  if (!groupName || !groupName.trim()) {
    alert("Please enter a group name");
    return;
  }
  socket.emit("createGroup", { groupName: groupName.trim() });
}

/**
 * Join an existing group
 * @param {string} groupName - Name of the group to join
 */
export function joinGroup(groupName) {
  socket.emit("joinGroup", { groupName });
}

/**
 * Send a message to a group
 * @param {string} groupName - Name of the group
 * @param {string} message - Message text to send
 */
export function sendGroupMessage(groupName, message) {
  socket.emit("groupMessage", { groupName, message });
}

/**
 * Request all groups from server
 */
export function requestGroups() {
  socket.emit("requestGroups");
}

/**
 * Clear new group input field
 */
export function clearNewGroupInput() {
  const newGroupNameInput = document.getElementById("new-group-name");
  if (newGroupNameInput) {
    newGroupNameInput.value = "";
  }
}
