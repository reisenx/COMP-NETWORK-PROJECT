/**
 * @fileoverview Group list UI module
 * Handles displaying and updating the groups list
 */

import { isUserInGroup } from "../../core/state.js";
import { updateUnreadBadges } from "../notifications/unreadCounter.js";

/**
 * Display groups list in the sidebar
 * Creates list items with group info, member list, and join/open buttons
 * @param {Array<{name: string, members: string[], memberCount: number}>} groups - Array of group objects
 * @param {Function} onJoinGroup - Callback for joining a group
 * @param {Function} onOpenGroup - Callback for opening a group chat
 */
export function outputGroupsList(groups, onJoinGroup, onOpenGroup) {
  const groupsList = document.getElementById("groups-list");
  if (!groupsList) return;

  groupsList.innerHTML = "";

  if (groups.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No groups yet";
    li.style.opacity = "0.6";
    groupsList.appendChild(li);
    return;
  }

  groups.forEach((group) => {
    const li = document.createElement("li");
    li.classList.add("group-item");
    li.setAttribute("data-chat-id", `group_${group.name}`);

    const groupNameDiv = document.createElement("div");
    groupNameDiv.textContent = group.name;
    groupNameDiv.style.fontWeight = "bold";

    const membersDiv = document.createElement("div");
    membersDiv.textContent = `Members: ${group.members.join(", ")}`;
    membersDiv.style.fontSize = "0.85em";
    membersDiv.style.opacity = "0.8";
    membersDiv.style.marginTop = "4px";

    const isMember = isUserInGroup(group.name);

    const joinBtn = document.createElement("button");
    if (isMember) {
      joinBtn.textContent = "Joined ✓";
      joinBtn.disabled = true;
      joinBtn.style.opacity = "0.6";
    } else {
      joinBtn.textContent = "Join";
      joinBtn.addEventListener("click", () => {
        if (onJoinGroup) onJoinGroup(group.name);
      });
    }
    joinBtn.classList.add("btn-small");
    joinBtn.style.marginTop = "8px";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "Open";
    viewBtn.classList.add("btn-small");
    viewBtn.style.marginTop = "8px";
    viewBtn.style.marginLeft = "8px";
    viewBtn.addEventListener("click", () => {
      if (isMember) {
        if (onOpenGroup) onOpenGroup(group.name);
      } else {
        alert("You must join the group first!");
      }
    });

    li.appendChild(groupNameDiv);
    li.appendChild(membersDiv);
    li.appendChild(joinBtn);
    li.appendChild(viewBtn);
    groupsList.appendChild(li);
  });

  // Update badges after creating groups
  setTimeout(() => updateUnreadBadges(), 0);
}
