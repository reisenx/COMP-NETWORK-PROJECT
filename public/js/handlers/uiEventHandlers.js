/**
 * @fileoverview UI event handlers
 * Handles user interface interactions (forms, buttons, etc.)
 */

import { getCurrentChat } from "../core/state.js";
import { CHAT_TYPES } from "../config/constants.js";
import { sendRoomMessage } from "../modules/chat/roomChat.js";
import { sendPrivateMessage } from "../modules/chat/privateChat.js";
import { sendGroupMessage, createGroup } from "../modules/chat/groupChat.js";
import {
  toggleNotifications,
  getNotificationSettings,
} from "../modules/notifications/notificationManager.js";

/**
 * Initialize all UI event handlers
 */
export function initializeUIHandlers() {
  setupChatForm();
  setupGroupCreation();
  setupNotificationToggle();
}

/**
 * Set up chat message form handler
 */
function setupChatForm() {
  const chatForm = document.getElementById("chat-form");
  if (!chatForm) return;

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value.trim();
    if (!msg) return;

    const currentChat = getCurrentChat();

    if (currentChat.type === CHAT_TYPES.ROOM) {
      sendRoomMessage(msg);
    } else if (currentChat.type === CHAT_TYPES.PRIVATE) {
      sendPrivateMessage(currentChat.target, msg);
    } else if (currentChat.type === CHAT_TYPES.GROUP) {
      sendGroupMessage(currentChat.name, msg);
    }

    e.target.elements.msg.value = "";
    e.target.elements.msg.focus();
  });
}

/**
 * Set up group creation handlers
 */
function setupGroupCreation() {
  const createGroupBtn = document.getElementById("create-group-btn");
  const newGroupNameInput = document.getElementById("new-group-name");

  if (createGroupBtn) {
    createGroupBtn.addEventListener("click", () => {
      const groupName = newGroupNameInput?.value.trim();
      if (!groupName) {
        alert("Please enter a group name");
        return;
      }
      createGroup(groupName);
    });
  }

  if (newGroupNameInput) {
    newGroupNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        createGroupBtn?.click();
      }
    });
  }
}

/**
 * Set up notification toggle button
 */
function setupNotificationToggle() {
  const notificationToggle = document.getElementById("notification-toggle");
  const notificationIcon = document.getElementById("notification-icon");

  if (!notificationToggle) return;

  // Update icon based on current settings
  updateNotificationIcon();

  notificationToggle.addEventListener("click", () => {
    const enabled = toggleNotifications();
    updateNotificationIcon();
    console.log(`[NOTIFICATIONS] ${enabled ? "Enabled" : "Disabled"}`);
  });
}

/**
 * Update notification icon based on enabled state
 */
function updateNotificationIcon() {
  const notificationIcon = document.getElementById("notification-icon");
  if (!notificationIcon) return;

  const settings = getNotificationSettings();

  if (settings.enabled) {
    notificationIcon.classList.remove("fa-bell-slash");
    notificationIcon.classList.add("fa-bell");
  } else {
    notificationIcon.classList.remove("fa-bell");
    notificationIcon.classList.add("fa-bell-slash");
  }
}
