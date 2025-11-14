/**
 * @fileoverview Socket event handlers
 * Centralized socket event handling and initialization
 */

import { socket } from "../core/socket.js";
import {
  getUsername,
  getRoom,
  setCurrentChat,
  activeChats,
  addActiveChat,
  hasActiveChat,
  userGroups,
  addUserGroup,
  removeUserGroup,
  getCurrentChat,
} from "../core/state.js";
import { CHAT_TYPES, URLS, STORAGE_KEYS } from "../config/constants.js";
import { getChatId } from "../utils/chatUtils.js";
import {
  outputMessage,
  clearMessages,
  scrollToBottom,
  outputMessages,
} from "../modules/ui/messageRenderer.js";
import {
  outputRoomName,
  outputUserList,
  makeUsersClickable,
} from "../modules/ui/userListUI.js";
import { outputGroupsList } from "../modules/ui/groupListUI.js";
import { updateActiveChatsList } from "../modules/ui/activeChatList.js";
import { updateChatContext } from "../modules/ui/chatContext.js";
import { showChatNotification } from "../modules/notifications/notificationManager.js";
import { applyTheme } from "../modules/theme/themeManager.js";
import { switchToRoomChat } from "../modules/chat/roomChat.js";
import { switchToPrivateChat } from "../modules/chat/privateChat.js";
import {
  switchToGroupChat,
  clearNewGroupInput,
  requestGroups,
} from "../modules/chat/groupChat.js";

/**
 * Initialize all socket event handlers
 */
export function initializeSocketHandlers() {
  // Connection handlers
  socket.on("joinError", handleJoinError);

  // Room handlers
  socket.on("roomHistory", handleRoomHistory);
  socket.on("roomUsers", handleRoomUsers);
  socket.on("allUsers", handleAllUsers);
  socket.on("message", handleMessage);

  // Private message handlers
  socket.on("privateMessage", handlePrivateMessage);
  socket.on("privateMessageError", handlePrivateMessageError);
  socket.on("privateHistory", handlePrivateHistory);

  // Group handlers
  socket.on("allGroups", handleAllGroups);
  socket.on("groupCreated", handleGroupCreated);
  socket.on("groupJoined", handleGroupJoined);
  socket.on("groupJoinedSuccess", handleGroupJoinedSuccess);
  socket.on("groupMessage", handleGroupMessage);
  socket.on("groupError", handleGroupError);
  socket.on("groupHistory", handleGroupHistory);

  // Theme handler
  socket.on("themePreference", handleThemePreference);
}

/**
 * Join the room with theme preference
 */
export function joinRoom() {
  const username = getUsername();
  const room = getRoom();
  const pendingTheme = sessionStorage.getItem(STORAGE_KEYS.PENDING_THEME);
  const themeToSend = pendingTheme || "light";

  socket.emit("joinRoom", { username, room, theme: themeToSend });

  if (pendingTheme) {
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_THEME);
  }
}

// ==================== CONNECTION HANDLERS ====================

/**
 * Handle join errors (e.g., duplicate username)
 * @param {string} errorMessage - Error message from server
 */
function handleJoinError(errorMessage) {
  alert(errorMessage);
  window.location.href = URLS.INDEX;
}

// ==================== ROOM HANDLERS ====================

/**
 * Handle room history from server
 * @param {Object} data - Room history data
 */
function handleRoomHistory({ room, messages }) {
  const currentChat = getCurrentChat();
  if (room === currentChat.name && currentChat.type === CHAT_TYPES.ROOM) {
    const chatId = `room_${room}`;
    if (!hasActiveChat(chatId)) {
      addActiveChat(chatId, {
        type: CHAT_TYPES.ROOM,
        name: room,
        messages: [],
      });
    }
    const chat = activeChats.get(chatId);
    chat.messages = messages;

    outputMessages(messages);
  }
}

/**
 * Handle room users update
 * @param {Object} data - Room users data
 */
function handleRoomUsers({ room, users }) {
  const roomUserList = document.getElementById("room-users");
  const allUserList = document.getElementById("all-users");

  outputRoomName(room);
  outputUserList(users, roomUserList);
  makeUsersClickable(allUserList, switchToPrivateChat);
}

/**
 * Handle all users update
 * @param {Object} data - All users data
 */
function handleAllUsers({ users }) {
  const allUserList = document.getElementById("all-users");
  outputUserList(users, allUserList);
  makeUsersClickable(allUserList, switchToPrivateChat);
}

/**
 * Handle incoming room messages
 * @param {Object} message - Message object
 */
function handleMessage(message) {
  const room = getRoom();
  const chatId = `room_${room}`;
  const currentChat = getCurrentChat();

  if (currentChat.type === CHAT_TYPES.ROOM && currentChat.name === room) {
    outputMessage(message);
    scrollToBottom();

    if (!hasActiveChat(chatId)) {
      addActiveChat(chatId, {
        type: CHAT_TYPES.ROOM,
        name: room,
        messages: [],
      });
    }
    activeChats.get(chatId).messages.push(message);
  } else {
    if (!hasActiveChat(chatId)) {
      addActiveChat(chatId, {
        type: CHAT_TYPES.ROOM,
        name: room,
        messages: [],
      });
    }
    activeChats.get(chatId).messages.push(message);
    showChatNotification(chatId, room, message.message, message.username);
  }
}

// ==================== PRIVATE MESSAGE HANDLERS ====================

/**
 * Handle incoming private messages
 * @param {Object} data - Private message data
 */
function handlePrivateMessage({ from, to, message, room: pmRoom }) {
  const username = getUsername();
  const chatId = pmRoom || `${from}_pm_${to || username}`;
  const otherUser = from === username ? to || "Unknown" : from;
  const currentChat = getCurrentChat();

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.PRIVATE,
      name: otherUser,
      messages: [],
    });
    updateActiveChatsList(
      switchToRoomChat,
      switchToPrivateChat,
      switchToGroupChat
    );
  }

  activeChats.get(chatId).messages.push(message);

  if (
    currentChat.type === CHAT_TYPES.PRIVATE &&
    currentChat.target === otherUser
  ) {
    outputMessage(message);
    scrollToBottom();
  } else {
    showChatNotification(chatId, otherUser, message.message, from);
  }
}

/**
 * Handle private message errors
 * @param {string} error - Error message
 */
function handlePrivateMessageError(error) {
  alert(error);
}

/**
 * Handle private chat history
 * @param {Object} data - Private history data
 */
function handlePrivateHistory({ otherUsername, messages }) {
  const chatId = getChatId({
    type: CHAT_TYPES.PRIVATE,
    name: `Private: ${otherUsername}`,
    target: otherUsername,
  });
  const currentChat = getCurrentChat();

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.PRIVATE,
      name: otherUsername,
      messages: [],
    });
  }
  activeChats.get(chatId).messages = messages;

  if (
    currentChat.type === CHAT_TYPES.PRIVATE &&
    currentChat.target === otherUsername
  ) {
    outputMessages(messages);
  }
}

// ==================== GROUP HANDLERS ====================

/**
 * Handle all groups data
 * @param {Object} data - Groups data
 */
function handleAllGroups({ groups }) {
  const username = getUsername();
  groups.forEach((group) => {
    if (group.members.includes(username)) {
      addUserGroup(group.name);
    }
  });
  outputGroupsList(groups, joinGroup, switchToGroupChat);
}

/**
 * Join a group (emit event)
 * @param {string} groupName - Group name
 */
function joinGroup(groupName) {
  socket.emit("joinGroup", { groupName });
}

/**
 * Handle successful group creation
 * @param {Object} data - Group creation data
 */
function handleGroupCreated({ group }) {
  alert(`Group "${group.name}" created successfully!`);
  clearNewGroupInput();

  addUserGroup(group.name);

  const chatId = `group_${group.name}`;
  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.GROUP,
      name: group.name,
      messages: [],
    });
    updateActiveChatsList(
      switchToRoomChat,
      switchToPrivateChat,
      switchToGroupChat
    );
  }

  switchToGroupChat(group.name);
  requestGroups();
}

/**
 * Handle notification when another user joins a group
 * @param {Object} data - Group join data
 */
function handleGroupJoined({ groupName, username: joinedUser }) {
  const username = getUsername();
  const currentChat = getCurrentChat();

  if (joinedUser !== username) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const notification = {
      username: "System",
      message: `${joinedUser} joined group "${groupName}"`,
      timestamp: timestamp,
    };
    if (
      currentChat.type === CHAT_TYPES.GROUP &&
      currentChat.name === groupName
    ) {
      outputMessage(notification);
    }
  }
}

/**
 * Handle successful group join for current user
 * @param {Object} data - Group join success data
 */
function handleGroupJoinedSuccess({ group }) {
  alert(`You joined group "${group.name}"!`);

  addUserGroup(group.name);

  const chatId = `group_${group.name}`;
  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.GROUP,
      name: group.name,
      messages: [],
    });
    updateActiveChatsList(
      switchToRoomChat,
      switchToPrivateChat,
      switchToGroupChat
    );
  }

  requestGroups();
  switchToGroupChat(group.name);
}

/**
 * Handle incoming group messages
 * @param {Object} data - Group message data
 */
function handleGroupMessage({ groupName, message }) {
  const currentChat = getCurrentChat();
  addUserGroup(groupName);

  const chatId = `group_${groupName}`;

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.GROUP,
      name: groupName,
      messages: [],
    });
    updateActiveChatsList(
      switchToRoomChat,
      switchToPrivateChat,
      switchToGroupChat
    );
  }

  activeChats.get(chatId).messages.push(message);

  if (currentChat.type === CHAT_TYPES.GROUP && currentChat.name === groupName) {
    outputMessage(message);
    scrollToBottom();
  } else {
    showChatNotification(chatId, groupName, message.message, message.username);
  }
}

/**
 * Handle group-related errors
 * @param {string} error - Error message
 */
function handleGroupError(error) {
  alert(error);
  const currentChat = getCurrentChat();

  if (error.includes("not a member")) {
    const groupName =
      currentChat.type === CHAT_TYPES.GROUP ? currentChat.name : null;
    if (groupName) {
      removeUserGroup(groupName);
    }
  }
}

/**
 * Handle group chat history
 * @param {Object} data - Group history data
 */
function handleGroupHistory({ groupName, messages }) {
  const chatId = `group_${groupName}`;
  const currentChat = getCurrentChat();

  if (!hasActiveChat(chatId)) {
    addActiveChat(chatId, {
      type: CHAT_TYPES.GROUP,
      name: groupName,
      messages: [],
    });
  }
  activeChats.get(chatId).messages = messages;

  if (currentChat.type === CHAT_TYPES.GROUP && currentChat.name === groupName) {
    outputMessages(messages);
  }
}

// ==================== THEME HANDLER ====================

/**
 * Handle theme preference from server
 * @param {Object} data - Theme preference data
 */
function handleThemePreference({ theme }) {
  if (theme === "light" || theme === "dark") {
    applyTheme(theme);
    console.log(`[THEME] Received theme preference from server: ${theme}`);
  }
}
