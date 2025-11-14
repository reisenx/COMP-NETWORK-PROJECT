/**
 * @fileoverview Notification manager module
 * Centralizes notification settings and coordination
 */

import {
  showBrowserNotification,
  isPageFocused,
} from "./browserNotifaction.js";
import { playNotificationSound } from "./soundNotification.js";
import { incrementUnreadCount } from "./unreadCounter.js";
import { getCurrentChatId } from "../../utils/chatUtils.js";
import {
  STORAGE_KEYS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "../../config/constants.js";

/**
 * Notification settings object
 * @typedef {Object} NotificationSettings
 * @property {boolean} browser - Enable browser notifications
 * @property {boolean} sound - Enable notification sounds
 * @property {boolean} enabled - Master notification toggle
 */

/**
 * Current notification settings (stored in localStorage)
 * @type {NotificationSettings}
 */
let notificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };

/**
 * Load notification settings from localStorage
 * Merges saved settings with defaults
 */
export function loadNotificationSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
  if (saved) {
    notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
  }
}

/**
 * Save current notification settings to localStorage
 */
export function saveNotificationSettings() {
  localStorage.setItem(
    STORAGE_KEYS.NOTIFICATION_SETTINGS,
    JSON.stringify(notificationSettings)
  );
}

/**
 * Get current notification settings
 * @returns {NotificationSettings} Current notification settings
 */
export function getNotificationSettings() {
  return notificationSettings;
}

/**
 * Update notification settings
 * @param {Partial<NotificationSettings>} newSettings - Settings to update
 */
export function updateNotificationSettings(newSettings) {
  notificationSettings = { ...notificationSettings, ...newSettings };
  saveNotificationSettings();
}

/**
 * Toggle master notification enabled/disabled
 * @returns {boolean} New enabled state
 */
export function toggleNotifications() {
  notificationSettings.enabled = !notificationSettings.enabled;
  saveNotificationSettings();
  return notificationSettings.enabled;
}

/**
 * Show comprehensive notification for a chat message
 * Handles unread counting, sound, and browser notifications
 * @param {string} chatId - Unique identifier for the chat
 * @param {string} chatName - Display name of the chat
 * @param {string} messagePreview - Preview of message content
 * @param {string} senderName - Username of the sender
 */
export function showChatNotification(
  chatId,
  chatName,
  messagePreview,
  senderName
) {
  if (!notificationSettings.enabled) return;

  // Don't show notification if this is the current active chat
  const currentChatId = getCurrentChatId();
  if (chatId === currentChatId && isPageFocused()) {
    return;
  }

  // Increment unread count
  incrementUnreadCount(chatId);

  // Play sound
  playNotificationSound();

  // Show browser notification
  showBrowserNotification(chatName, messagePreview, senderName);
}
