/**
 * @fileoverview Browser notification module
 * Handles native browser notifications
 */

import { getNotificationSettings } from "./notificationManager.js";

/**
 * Request notification permission from the browser
 * Only prompts if permission hasn't been requested before
 */
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log(`[NOTIFICATIONS] Permission ${permission}`);
    });
  }
}

/**
 * Check if the browser window/tab is currently focused
 * @returns {boolean} True if page has focus
 */
export function isPageFocused() {
  return document.hasFocus();
}

/**
 * Show a browser notification for a new message
 * Only shows if page is not focused and permissions are granted
 * @param {string} chatName - Name of the chat/room
 * @param {string} messagePreview - Preview of the message content
 * @param {string} senderName - Username of the sender
 */
export function showBrowserNotification(chatName, messagePreview, senderName) {
  const settings = getNotificationSettings();

  if (!settings.browser || !settings.enabled) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Only show notification if page is not focused
  if (isPageFocused()) return;

  const title = `New message from ${senderName || chatName}`;
  const body =
    messagePreview.length > 100
      ? messagePreview.substring(0, 100) + "..."
      : messagePreview;

  const notification = new Notification(title, {
    body: body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: chatName,
    requireInteraction: false,
  });

  // Auto-close notification after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Click notification to focus window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
