/**
 * @fileoverview User list UI module
 * Handles displaying and updating user lists
 */

import { getUsername } from "../../core/state.js";
import { updateUnreadBadges } from "../notifications/unreadCounter.js";

/**
 * Display room name in the UI
 * @param {string} room - Room name to display
 */
export function outputRoomName(room) {
  const roomName = document.getElementById("room-name");
  if (roomName) {
    roomName.innerText = room;
  }
}

/**
 * Display user list in a specified element
 * Creates list items with usernames and sets up data attributes for interaction
 * @param {Array<{username: string, id: string, room?: string}>} users - Array of user objects
 * @param {HTMLElement} element - DOM element to populate with user list
 */
export function outputUserList(users, element) {
  if (!element) return;

  element.innerHTML = "";
  const username = getUsername();

  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    li.setAttribute("data-username", user.username);
    li.classList.add("clickable-user");

    // Set chat ID for badge tracking (only for all users list, not room users)
    const allUserList = document.getElementById("all-users");
    if (element === allUserList && user.username !== username) {
      const chatId = `${user.username}_pm`;
      li.setAttribute("data-chat-id", chatId);
    }

    element.appendChild(li);
  });

  // Update badges after creating user list
  const allUserList = document.getElementById("all-users");
  if (element === allUserList) {
    setTimeout(() => updateUnreadBadges(), 0);
  }
}

/**
 * Make users in a list clickable for private messaging
 * Adds click event listeners to start private chats
 * @param {HTMLElement} element - Container element with clickable user items
 * @param {Function} onUserClick - Callback function when user is clicked
 */
export function makeUsersClickable(element, onUserClick) {
  if (!element) return;

  const username = getUsername();
  element.querySelectorAll(".clickable-user").forEach((li) => {
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      const targetUsername = li.getAttribute("data-username");
      if (targetUsername && targetUsername !== username && onUserClick) {
        onUserClick(targetUsername);
      }
    });
  });
}
