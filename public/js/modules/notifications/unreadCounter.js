/**
 * @fileoverview Unread message counter module
 * Tracks and displays unread message badges
 */

/**
 * Map tracking unread message counts per chat
 * @type {Map<string, number>}
 */
const unreadCounts = new Map();

/**
 * Increment unread message count for a specific chat
 * Updates the UI badges
 * @param {string} chatId - Unique identifier for the chat
 */
export function incrementUnreadCount(chatId) {
  const current = unreadCounts.get(chatId) || 0;
  unreadCounts.set(chatId, current + 1);
  updateUnreadBadges();
}

/**
 * Clear unread message count for a specific chat
 * Updates the UI badges
 * @param {string} chatId - Unique identifier for the chat
 */
export function clearUnreadCount(chatId) {
  unreadCounts.delete(chatId);
  updateUnreadBadges();
}

/**
 * Get unread count for a specific chat
 * @param {string} chatId - Unique identifier for the chat
 * @returns {number} Unread message count
 */
export function getUnreadCount(chatId) {
  return unreadCounts.get(chatId) || 0;
}

/**
 * Update unread badges across all UI elements
 * Updates badges in active chats list, groups list, and users list
 */
export function updateUnreadBadges() {
  const activeChatsList = document.getElementById("active-chats");
  const groupsList = document.getElementById("groups-list");
  const allUserList = document.getElementById("all-users");

  // Update active chats list
  if (activeChatsList) {
    activeChatsList.querySelectorAll(".active-chat-item").forEach((item) => {
      const chatId = item.getAttribute("data-chat-id");
      if (chatId) {
        updateBadgeForItem(item, chatId);
      }
    });
  }

  // Update groups list
  if (groupsList) {
    groupsList.querySelectorAll(".group-item").forEach((item) => {
      const chatId = item.getAttribute("data-chat-id");
      if (chatId) {
        updateBadgeForItem(item, chatId);
      }
    });
  }

  // Update all users list (for private chats)
  if (allUserList) {
    allUserList.querySelectorAll(".clickable-user").forEach((item) => {
      const chatId = item.getAttribute("data-chat-id");
      if (chatId) {
        updateBadgeForItem(item, chatId);
      }
    });
  }
}

/**
 * Helper function to update or create unread badge for a specific item
 * @param {HTMLElement} item - DOM element to add badge to
 * @param {string} chatId - Unique identifier for the chat
 */
function updateBadgeForItem(item, chatId) {
  const count = unreadCounts.get(chatId) || 0;
  let badge = item.querySelector(".unread-badge");

  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.classList.add("unread-badge");
      item.appendChild(badge);
    }
    badge.textContent = count > 99 ? "99+" : count.toString();
  } else {
    if (badge) {
      badge.remove();
    }
  }
}
