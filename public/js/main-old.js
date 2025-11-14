/**
 * @fileoverview Real-time chat application client-side logic
 * Handles room chat, private messaging, group chats, notifications, and theme management
 */

// ==================== DOM ELEMENTS ====================

/** @type {HTMLFormElement} Chat message form element */
const chatForm = document.getElementById("chat-form");

/** @type {HTMLElement} Container for chat messages */
const chatMessages = document.querySelector(".chat-messages");

/** @type {HTMLElement} Display element for current room name */
const roomName = document.getElementById("room-name");

/** @type {HTMLElement} List element for users (legacy) */
const userList = document.getElementById("users");

/** @type {HTMLElement} List element for users in current room */
const roomUserList = document.getElementById("room-users");

/** @type {HTMLElement} List element for all online users */
const allUserList = document.getElementById("all-users");

/** @type {HTMLElement} List element for available groups */
const groupsList = document.getElementById("groups-list");

/** @type {HTMLElement} List element for active chat conversations */
const activeChatsList = document.getElementById("active-chats");

/** @type {HTMLButtonElement} Button to create a new group */
const createGroupBtn = document.getElementById("create-group-btn");

/** @type {HTMLInputElement} Input field for new group name */
const newGroupNameInput = document.getElementById("new-group-name");

/** @type {HTMLElement} Display element for current chat type (Room/Private/Group) */
const currentChatType = document.getElementById("current-chat-type");

/** @type {HTMLElement} Display element for current chat name */
const currentChatName = document.getElementById("current-chat-name");

// ==================== INITIALIZATION ====================

/**
 * Current user's username and room parsed from URL query parameters
 * @type {{username: string, room: string}}
 */
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

/** @type {SocketIOClient.Socket} Socket.IO client instance */
const socket = io();

// ==================== STATE MANAGEMENT ====================

/**
 * Current active chat state
 * @typedef {Object} ChatState
 * @property {'room'|'private'|'group'} type - Type of chat
 * @property {string} name - Display name of the chat
 * @property {string|null} target - Target username for private chats
 */

/**
 * Current chat state tracking
 * @type {ChatState}
 */
let currentChat = {
  type: "room", // 'room', 'private', 'group'
  name: room,
  target: null, // for private messages
};

/**
 * Message object structure
 * @typedef {Object} Message
 * @property {string} username - Sender's username
 * @property {string} message - Message content
 * @property {string} timestamp - Formatted timestamp (e.g., "3:45 pm")
 * @property {number} [_timestamp] - Internal timestamp in milliseconds
 */

/**
 * Chat data structure
 * @typedef {Object} ChatData
 * @property {'room'|'private'|'group'} type - Type of chat
 * @property {string} name - Name of the chat
 * @property {Message[]} messages - Array of messages in this chat
 */

/**
 * Store active chats with their message history
 * @type {Map<string, ChatData>}
 */
const activeChats = new Map(); // key: chatId, value: {type, name, messages}

/**
 * Track which groups the current user is a member of
 * @type {Set<string>}
 */
const userGroups = new Set(); // Set of group names

// ==================== SOCKET EVENT HANDLERS ====================

/**
 * Handle join errors (e.g., duplicate username)
 * Redirects user back to login page with an alert
 * @event socket#joinError
 * @param {string} errorMessage - Error message from server
 */
socket.on("joinError", (errorMessage) => {
  alert(errorMessage);
  window.location.href = "index.html";
});

// Join chat room - send current theme preference if available
const pendingTheme = sessionStorage.getItem("pendingTheme");
const themeToSend = pendingTheme || "light";

/**
 * Emit joinRoom event to server with user credentials and theme preference
 * @fires socket#joinRoom
 */
socket.emit("joinRoom", { username, room, theme: themeToSend });

// Clear pending theme after sending
if (pendingTheme) {
  sessionStorage.removeItem("pendingTheme");
}

/**
 * Handle room history received from server when joining a room
 * Loads and displays historical messages for the current room
 * @event socket#roomHistory
 * @param {Object} data - Room history data
 * @param {string} data.room - Room name
 * @param {Message[]} data.messages - Array of historical messages
 */
socket.on("roomHistory", ({ room, messages }) => {
  if (room === currentChat.name && currentChat.type === "room") {
    // Load history into active chats
    const chatId = `room_${room}`;
    if (!activeChats.has(chatId)) {
      activeChats.set(chatId, {
        type: "room",
        name: room,
        messages: [],
      });
    }
    activeChats.get(chatId).messages = messages;
    // Display messages
    chatMessages.innerHTML = "";
    messages.forEach((msg) => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

/**
 * Handle room users update from server
 * Updates the display of users in the current room
 * @event socket#roomUsers
 * @param {Object} data - Room users data
 * @param {string} data.room - Room name
 * @param {Array<{username: string, id: string}>} data.users - Array of users in room
 */
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUserList(users, roomUserList);
  makeUsersClickable(allUserList);
});

/**
 * Handle all users update from server
 * Updates the display of all online users across all rooms
 * @event socket#allUsers
 * @param {Object} data - All users data
 * @param {Array<{username: string, id: string, room: string}>} data.users - Array of all online users
 */
socket.on("allUsers", ({ users }) => {
  outputUserList(users, allUserList);
  makeUsersClickable(allUserList);
});

/**
 * Handle incoming room messages from server
 * Displays message if user is in the room, otherwise shows notification
 * @event socket#message
 * @param {Message} message - Message object from server
 */
socket.on("message", (message) => {
  const chatId = `room_${room}`;

  if (currentChat.type === "room" && currentChat.name === room) {
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Store in active chats
    if (!activeChats.has(chatId)) {
      activeChats.set(chatId, {
        type: "room",
        name: room,
        messages: [],
      });
    }
    activeChats.get(chatId).messages.push(message);
  } else {
    // Store message but show notification
    if (!activeChats.has(chatId)) {
      activeChats.set(chatId, {
        type: "room",
        name: room,
        messages: [],
      });
    }
    activeChats.get(chatId).messages.push(message);
    showChatNotification(chatId, room, message.message, message.username);
  }
});

/**
 * Handle incoming private messages (R7: Private Messaging)
 * Displays message if chat is active, otherwise stores and shows notification
 * @event socket#privateMessage
 * @param {Object} data - Private message data
 * @param {string} data.from - Sender username
 * @param {string} [data.to] - Recipient username
 * @param {Message} data.message - Message object
 * @param {string} [data.room] - Private room identifier
 */
socket.on("privateMessage", ({ from, to, message, room: pmRoom }) => {
  const chatId = pmRoom || `${from}_pm_${to || username}`;
  const otherUser = from === username ? to || "Unknown" : from;

  // Store message
  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "private",
      name: otherUser,
      messages: [],
    });
    updateActiveChatsList();
  }

  activeChats.get(chatId).messages.push(message);

  // Display if this is the current chat
  if (currentChat.type === "private" && currentChat.target === otherUser) {
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    // Show notification
    showChatNotification(chatId, otherUser, message.message, from);
  }
});

/**
 * Handle private message errors from server
 * @event socket#privateMessageError
 * @param {string} error - Error message
 */
socket.on("privateMessageError", (error) => {
  alert(error);
});

/**
 * Handle private chat history from server
 * Loads historical messages for a private conversation
 * @event socket#privateHistory
 * @param {Object} data - Private history data
 * @param {string} data.otherUsername - Other participant's username
 * @param {Message[]} data.messages - Array of historical messages
 */
socket.on("privateHistory", ({ otherUsername, messages }) => {
  const chatId = getChatId({
    type: "private",
    name: `Private: ${otherUsername}`,
    target: otherUsername,
  });

  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "private",
      name: otherUsername,
      messages: [],
    });
  }
  activeChats.get(chatId).messages = messages;

  // Display if this is the current chat
  if (currentChat.type === "private" && currentChat.target === otherUsername) {
    chatMessages.innerHTML = "";
    messages.forEach((msg) => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

/**
 * Handle all groups data from server (R8, R9: Group Management)
 * Updates user's group membership and displays group list
 * @event socket#allGroups
 * @param {Object} data - Groups data
 * @param {Array<{name: string, members: string[], memberCount: number}>} data.groups - Array of group objects
 */
socket.on("allGroups", ({ groups }) => {
  // Update userGroups set based on member lists
  groups.forEach((group) => {
    if (group.members.includes(username)) {
      userGroups.add(group.name);
    }
  });
  outputGroupsList(groups);
});

/**
 * Handle successful group creation
 * Switches to the newly created group and updates UI
 * @event socket#groupCreated
 * @param {Object} data - Group creation data
 * @param {Object} data.group - Created group object
 * @param {string} data.group.name - Group name
 */
socket.on("groupCreated", ({ group }) => {
  alert(`Group "${group.name}" created successfully!`);
  newGroupNameInput.value = "";

  // Add user to groups set
  userGroups.add(group.name);

  // Add group to active chats
  const chatId = `group_${group.name}`;
  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "group",
      name: group.name,
      messages: [],
    });
    updateActiveChatsList();
  }

  // Automatically switch to the new group chat
  switchToGroupChat(group.name);

  socket.emit("requestGroups");
});

/**
 * Handle notification when another user joins a group
 * @event socket#groupJoined
 * @param {Object} data - Group join data
 * @param {string} data.groupName - Name of the group
 * @param {string} data.username - Username of user who joined
 */
socket.on("groupJoined", ({ groupName, username: joinedUser }) => {
  if (joinedUser !== username) {
    // Show notification that someone joined
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
    if (currentChat.type === "group" && currentChat.name === groupName) {
      outputMessage(notification);
    }
  }
});

/**
 * Handle successful group join for current user
 * Switches to the group chat and updates UI
 * @event socket#groupJoinedSuccess
 * @param {Object} data - Group join success data
 * @param {Object} data.group - Group object
 * @param {string} data.group.name - Group name
 */
socket.on("groupJoinedSuccess", ({ group }) => {
  alert(`You joined group "${group.name}"!`);

  // Add to user groups set
  userGroups.add(group.name);

  const chatId = `group_${group.name}`;
  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "group",
      name: group.name,
      messages: [],
    });
    updateActiveChatsList();
  }

  // Refresh groups list to update UI
  socket.emit("requestGroups");

  // Automatically switch to the group chat
  switchToGroupChat(group.name);
});

/**
 * Handle incoming group messages (R11: Group Messaging)
 * Displays message if group chat is active, otherwise shows notification
 * @event socket#groupMessage
 * @param {Object} data - Group message data
 * @param {string} data.groupName - Name of the group
 * @param {Message} data.message - Message object
 */
socket.on("groupMessage", ({ groupName, message }) => {
  // If we receive a group message, we must be a member
  userGroups.add(groupName);

  const chatId = `group_${groupName}`;

  // Store message
  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "group",
      name: groupName,
      messages: [],
    });
    updateActiveChatsList();
  }

  activeChats.get(chatId).messages.push(message);

  // Display if this is the current chat
  if (currentChat.type === "group" && currentChat.name === groupName) {
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    showChatNotification(chatId, groupName, message.message, message.username);
  }
});

/**
 * Handle group-related errors from server
 * @event socket#groupError
 * @param {string} error - Error message
 */
socket.on("groupError", (error) => {
  alert(error);
  // If error is about not being a member, remove from userGroups
  if (error.includes("not a member")) {
    // Try to remove from userGroups if it exists
    const groupName = currentChat.type === "group" ? currentChat.name : null;
    if (groupName) {
      userGroups.delete(groupName);
    }
  }
});

/**
 * Handle group chat history from server
 * Loads historical messages for a group chat
 * @event socket#groupHistory
 * @param {Object} data - Group history data
 * @param {string} data.groupName - Name of the group
 * @param {Message[]} data.messages - Array of historical messages
 */
socket.on("groupHistory", ({ groupName, messages }) => {
  const chatId = `group_${groupName}`;

  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "group",
      name: groupName,
      messages: [],
    });
  }
  activeChats.get(chatId).messages = messages;

  // Display if this is the current chat
  if (currentChat.type === "group" && currentChat.name === groupName) {
    chatMessages.innerHTML = "";
    messages.forEach((msg) => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// ==================== FORM EVENT HANDLERS ====================

/**
 * Handle chat message form submission
 * Sends message to appropriate destination (room/private/group)
 * @listens submit
 */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value.trim();
  if (!msg) return;

  if (currentChat.type === "room") {
    socket.emit("chatMessage", msg);
  } else if (currentChat.type === "private") {
    socket.emit("privateMessage", {
      toUsername: currentChat.target,
      message: msg,
    });
  } else if (currentChat.type === "group") {
    // Check if user is a member before sending
    if (!userGroups.has(currentChat.name)) {
      alert("You are not a member of this group. Please join first.");
      return;
    }
    socket.emit("groupMessage", {
      groupName: currentChat.name,
      message: msg,
    });
  }

  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

/**
 * Handle create group button click
 * Validates input and sends group creation request to server
 * @listens click
 */
createGroupBtn.addEventListener("click", () => {
  const groupName = newGroupNameInput.value.trim();
  if (!groupName) {
    alert("Please enter a group name");
    return;
  }
  socket.emit("createGroup", { groupName });
});

/**
 * Handle Enter key press in group name input
 * Triggers group creation button click
 * @listens keypress
 */
newGroupNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    createGroupBtn.click();
  }
});

// ==================== UI UPDATE FUNCTIONS ====================

/**
 * Display a message in the chat window
 * Creates and appends a message div with username, timestamp, and content
 * @param {Message} message - Message object to display
 */
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.timestamp}</span> </p>
    <p class="text">
    ${message.message}
    </p>`;
  chatMessages.appendChild(div);
}

/**
 * Clear messages and load chat history for a specific chat
 * Retrieves messages from activeChats map and displays them
 * @param {ChatState} chat - Chat state object
 */
function loadChatHistory(chat) {
  chatMessages.innerHTML = "";
  const chatId = getChatId(chat);
  if (activeChats.has(chatId)) {
    const chatData = activeChats.get(chatId);
    chatData.messages.forEach((msg) => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Generate unique chat ID based on chat type and participants
 * @param {ChatState} chat - Chat state object
 * @returns {string} Unique chat identifier
 */
function getChatId(chat) {
  if (chat.type === "room") {
    return `room_${chat.name}`;
  } else if (chat.type === "private") {
    const sorted = [username, chat.target].sort();
    return `${sorted[0]}_pm_${sorted[1]}`;
  } else if (chat.type === "group") {
    return `group_${chat.name}`;
  }
}

/**
 * Display room name in the UI
 * @param {string} room - Room name to display
 */
function outputRoomName(room) {
  roomName.innerText = room;
}

/**
 * Display users list (legacy function, consider using outputUserList instead)
 * @deprecated Use outputUserList instead
 * @param {Array<{username: string}>} users - Array of user objects
 */
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map((user) => `<li>${user.username}</li>`).join("")}`;
}

/**
 * Display user list in a specified element
 * Creates list items with usernames and sets up data attributes for interaction
 * @param {Array<{username: string, id: string}>} users - Array of user objects
 * @param {HTMLElement} element - DOM element to populate with user list
 */
function outputUserList(users, element) {
  element.innerHTML = "";

  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    li.setAttribute("data-username", user.username);
    li.classList.add("clickable-user");

    // Set chat ID for badge tracking (only for all users list, not room users)
    if (element === allUserList && user.username !== username) {
      const sorted = [username, user.username].sort();
      const chatId = `${sorted[0]}_pm_${sorted[1]}`;
      li.setAttribute("data-chat-id", chatId);
    }

    element.appendChild(li);
  });

  // Update badges after creating user list
  if (element === allUserList) {
    setTimeout(() => updateUnreadBadges(), 0);
  }
}

/**
 * Make users in a list clickable for private messaging (R7)
 * Adds click event listeners to start private chats
 * @param {HTMLElement} element - Container element with clickable user items
 */
function makeUsersClickable(element) {
  element.querySelectorAll(".clickable-user").forEach((li) => {
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      const targetUsername = li.getAttribute("data-username");
      if (targetUsername !== username) {
        switchToPrivateChat(targetUsername);
      }
    });
  });
}

// ==================== CHAT NAVIGATION FUNCTIONS ====================

/**
 * Switch to private chat with a specific user
 * Creates or opens existing private chat and loads history
 * @param {string} targetUsername - Username of the other participant
 */
function switchToPrivateChat(targetUsername) {
  currentChat = {
    type: "private",
    name: `Private: ${targetUsername}`,
    target: targetUsername,
  };

  const chatId = getChatId(currentChat);

  // Clear unread count when switching to this chat
  clearUnreadCount(chatId);

  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "private",
      name: targetUsername,
      messages: [],
    });
    updateActiveChatsList();
    // Request history from server
    socket.emit("requestPrivateHistory", { otherUsername: targetUsername });
  } else {
    // Load from local cache first, then request from server to sync
    updateChatContext();
    loadChatHistory(currentChat);
    socket.emit("requestPrivateHistory", { otherUsername: targetUsername });
  }

  updateChatContext();
}

/**
 * Switch back to the main room chat
 * Clears unread count and loads room history
 */
function switchToRoomChat() {
  currentChat = {
    type: "room",
    name: room,
    target: null,
  };

  // Clear unread count when switching to this chat
  const chatId = getChatId(currentChat);
  clearUnreadCount(chatId);

  updateChatContext();
  loadChatHistory(currentChat);
}

/**
 * Switch to a specific group chat
 * Checks membership, loads history, or triggers join if not a member
 * @param {string} groupName - Name of the group to switch to
 */
function switchToGroupChat(groupName) {
  // Check if user is a member
  if (!userGroups.has(groupName)) {
    alert("You are not a member of this group. Joining now...");
    socket.emit("joinGroup", { groupName: groupName });
    return; // Will switch after join success
  }

  currentChat = {
    type: "group",
    name: groupName,
    target: null,
  };

  const chatId = getChatId(currentChat);

  // Clear unread count when switching to this chat
  clearUnreadCount(chatId);

  if (!activeChats.has(chatId)) {
    activeChats.set(chatId, {
      type: "group",
      name: groupName,
      messages: [],
    });
    updateActiveChatsList();
    // Request history from server
    socket.emit("requestGroupHistory", { groupName: groupName });
  } else {
    // Load from local cache first, then request from server to sync
    updateChatContext();
    loadChatHistory(currentChat);
    socket.emit("requestGroupHistory", { groupName: groupName });
  }

  updateChatContext();
}

/**
 * Update the chat context display showing current chat type and name
 * Updates the UI elements showing which chat is currently active
 */
function updateChatContext() {
  if (currentChat.type === "room") {
    currentChatType.textContent = "Room Chat";
    currentChatName.textContent = currentChat.name;
  } else if (currentChat.type === "private") {
    currentChatType.textContent = "Private Chat";
    currentChatName.textContent = currentChat.target;
  } else if (currentChat.type === "group") {
    currentChatType.textContent = "Group Chat";
    currentChatName.textContent = currentChat.name;
  }
}

/**
 * Display groups list in the sidebar (R9: Get All Groups)
 * Creates list items with group info, member list, and join/open buttons
 * @param {Array<{name: string, members: string[], memberCount: number}>} groups - Array of group objects
 */
function outputGroupsList(groups) {
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

    const isMember = userGroups.has(group.name);

    const joinBtn = document.createElement("button");
    if (isMember) {
      joinBtn.textContent = "Joined";
      joinBtn.disabled = true;
      joinBtn.style.opacity = "0.6";
    } else {
      joinBtn.textContent = "Join";
      joinBtn.addEventListener("click", () => {
        socket.emit("joinGroup", { groupName: group.name });
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
        switchToGroupChat(group.name);
      } else {
        // Auto-join and then open
        socket.emit("joinGroup", { groupName: group.name });
        // The groupJoinedSuccess handler will switch to the chat
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

/**
 * Update the active chats list in the sidebar
 * Displays all active conversations (room, private, and group chats)
 * Highlights the currently active chat
 */
function updateActiveChatsList() {
  activeChatsList.innerHTML = "";

  // Add room chat
  const roomLi = document.createElement("li");
  const roomText = document.createTextNode(`Room: ${room}`);
  roomLi.appendChild(roomText);
  roomLi.classList.add("active-chat-item");
  roomLi.setAttribute("data-chat-id", `room_${room}`);
  roomLi.style.cursor = "pointer";
  if (currentChat.type === "room") {
    roomLi.style.backgroundColor = "rgba(255,255,255,0.2)";
  }
  roomLi.addEventListener("click", () => switchToRoomChat());
  activeChatsList.appendChild(roomLi);

  // Add private chats
  activeChats.forEach((chatData, chatId) => {
    if (chatData.type === "private") {
      const li = document.createElement("li");
      const privateText = document.createTextNode(`Private: ${chatData.name}`);
      li.appendChild(privateText);
      li.classList.add("active-chat-item");
      li.setAttribute("data-chat-id", chatId);
      li.style.cursor = "pointer";
      if (
        currentChat.type === "private" &&
        currentChat.target === chatData.name
      ) {
        li.style.backgroundColor = "rgba(255,255,255,0.2)";
      }
      li.addEventListener("click", () => switchToPrivateChat(chatData.name));
      activeChatsList.appendChild(li);
    }
  });

  // Add group chats
  activeChats.forEach((chatData, chatId) => {
    if (chatData.type === "group") {
      const li = document.createElement("li");
      const groupText = document.createTextNode(`Group: ${chatData.name}`);
      li.appendChild(groupText);
      li.classList.add("active-chat-item");
      li.setAttribute("data-chat-id", chatId);
      li.style.cursor = "pointer";
      if (currentChat.type === "group" && currentChat.name === chatData.name) {
        li.style.backgroundColor = "rgba(255,255,255,0.2)";
      }
      li.addEventListener("click", () => switchToGroupChat(chatData.name));
      activeChatsList.appendChild(li);
    }
  });

  // Update badges after adding all items
  setTimeout(() => updateUnreadBadges(), 0);
}

// ==================== NOTIFICATION SYSTEM ====================

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
let notificationSettings = {
  browser: true,
  sound: true,
  enabled: true,
};

/**
 * Load notification settings from localStorage
 * Merges saved settings with defaults
 */
function loadNotificationSettings() {
  const saved = localStorage.getItem("notificationSettings");
  if (saved) {
    notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
  }
}

/**
 * Save current notification settings to localStorage
 */
function saveNotificationSettings() {
  localStorage.setItem(
    "notificationSettings",
    JSON.stringify(notificationSettings)
  );
}

/**
 * Map tracking unread message counts per chat
 * @type {Map<string, number>}
 */
const unreadCounts = new Map(); // chatId -> count

/**
 * Request notification permission from the browser
 * Only prompts if permission hasn't been requested before
 */
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted");
      }
    });
  }
}

/**
 * Check if the browser window/tab is currently focused
 * @returns {boolean} True if page has focus
 */
function isPageFocused() {
  return document.hasFocus();
}

/**
 * Play a notification sound using Web Audio API
 * Creates a simple beep sound (800Hz sine wave)
 */
function playNotificationSound() {
  if (!notificationSettings.sound) return;

  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log("Could not play notification sound:", e);
  }
}

/**
 * Show a browser notification for a new message
 * Only shows if page is not focused and permissions are granted
 * @param {string} chatName - Name of the chat/room
 * @param {string} messagePreview - Preview of the message content
 * @param {string} senderName - Username of the sender
 */
function showBrowserNotification(chatName, messagePreview, senderName) {
  if (!notificationSettings.browser || !notificationSettings.enabled) return;
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
    icon: "/favicon.ico", // You can add a favicon later
    badge: "/favicon.ico",
    tag: chatName, // Group notifications by chat
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

/**
 * Increment unread message count for a specific chat
 * Updates the UI badges
 * @param {string} chatId - Unique identifier for the chat
 */
function incrementUnreadCount(chatId) {
  const current = unreadCounts.get(chatId) || 0;
  unreadCounts.set(chatId, current + 1);
  updateUnreadBadges();
}

/**
 * Clear unread message count for a specific chat
 * Updates the UI badges
 * @param {string} chatId - Unique identifier for the chat
 */
function clearUnreadCount(chatId) {
  unreadCounts.delete(chatId);
  updateUnreadBadges();
}

/**
 * Update unread badges across all UI elements
 * Updates badges in active chats list, groups list, and users list
 */
function updateUnreadBadges() {
  // Update active chats list
  activeChatsList.querySelectorAll(".active-chat-item").forEach((item) => {
    const chatId = item.getAttribute("data-chat-id");
    if (!chatId) return;

    const count = unreadCounts.get(chatId) || 0;
    let badge = item.querySelector(".unread-badge");

    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "unread-badge";
        item.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : count;
    } else if (badge) {
      badge.remove();
    }
  });

  // Update groups list
  groupsList.querySelectorAll(".group-item").forEach((item) => {
    const chatId = item.getAttribute("data-chat-id");
    if (!chatId) {
      // Fallback: try to get from group name
      const groupNameDiv = item.querySelector("div");
      if (groupNameDiv) {
        const groupName = groupNameDiv.textContent.trim();
        const computedChatId = `group_${groupName}`;
        item.setAttribute("data-chat-id", computedChatId);
        updateBadgeForItem(item, computedChatId);
      }
    } else {
      updateBadgeForItem(item, chatId);
    }
  });

  // Update all users list (for private chats)
  allUserList.querySelectorAll(".clickable-user").forEach((item) => {
    const targetUsername = item.getAttribute("data-username");
    if (targetUsername && targetUsername !== username) {
      const sorted = [username, targetUsername].sort();
      const chatId = `${sorted[0]}_pm_${sorted[1]}`;
      item.setAttribute("data-chat-id", chatId);
      updateBadgeForItem(item, chatId);
    }
  });
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
      badge.className = "unread-badge";
      item.appendChild(badge);
    }
    badge.textContent = count > 99 ? "99+" : count;
  } else if (badge) {
    badge.remove();
  }
}

/**
 * Show comprehensive notification for a chat message
 * Handles unread counting, sound, and browser notifications
 * @param {string} chatId - Unique identifier for the chat
 * @param {string} chatName - Display name of the chat
 * @param {string} messagePreview - Preview of message content
 * @param {string} senderName - Username of the sender
 */
function showChatNotification(chatId, chatName, messagePreview, senderName) {
  if (!notificationSettings.enabled) return;

  // Don't show notification if this is the current active chat
  const currentChatId = getChatId(currentChat);
  if (chatId === currentChatId && isPageFocused()) {
    return; // User is viewing this chat, no need to notify
  }

  // Increment unread count
  incrementUnreadCount(chatId);

  // Play sound
  playNotificationSound();

  // Show browser notification
  showBrowserNotification(chatName, messagePreview, senderName);
}

// Initialize notification system
loadNotificationSettings();
requestNotificationPermission();

// Initialize chat state
updateChatContext();
switchToRoomChat();

// ==================== THEME MANAGEMENT ====================

/** @type {HTMLButtonElement} Theme toggle button */
const themeToggle = document.getElementById("theme-toggle");

/** @type {HTMLElement} Theme icon element */
const themeIcon = document.getElementById("theme-icon");

/** @type {HTMLHtmlElement} HTML root element */
const html = document.documentElement;

/**
 * Current theme setting
 * @type {'light'|'dark'}
 */
let currentTheme = "light";

// Initialize theme (will be updated from server)
html.setAttribute("data-theme", currentTheme);
updateIcon(currentTheme);

/**
 * Handle theme preference received from server (user-specific)
 * @event socket#themePreference
 * @param {Object} data - Theme preference data
 * @param {'light'|'dark'} data.theme - Theme setting
 */
socket.on("themePreference", ({ theme }) => {
  if (theme === "light" || theme === "dark") {
    currentTheme = theme;
    html.setAttribute("data-theme", theme);
    updateIcon(theme);
    console.log(`[THEME] Received theme preference from server: ${theme}`);
  }
});

/**
 * Handle theme toggle button click
 * Switches between light and dark themes
 * @listens click
 */
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    updateIcon(newTheme);

    // Send theme change to server (user-specific)
    socket.emit("changeTheme", { theme: newTheme });
  });
}

/**
 * Update theme icon based on current theme
 * @param {'light'|'dark'} theme - Current theme
 */
function updateIcon(theme) {
  if (themeIcon) {
    if (theme === "dark") {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    }
  }
}

// ==================== NOTIFICATION TOGGLE UI ====================

/** @type {HTMLButtonElement} Notification toggle button */
const notificationToggle = document.getElementById("notification-toggle");

/** @type {HTMLElement} Notification icon element */
const notificationIcon = document.getElementById("notification-icon");

/**
 * Update notification icon based on enabled state
 * Shows bell icon when enabled, bell-slash when disabled
 */
function updateNotificationIcon() {
  if (notificationIcon) {
    if (notificationSettings.enabled) {
      notificationIcon.classList.remove("fa-bell-slash");
      notificationIcon.classList.add("fa-bell");
      notificationToggle.title = "Disable notifications";
    } else {
      notificationIcon.classList.remove("fa-bell");
      notificationIcon.classList.add("fa-bell-slash");
      notificationToggle.title = "Enable notifications";
    }
  }
}

/**
 * Handle notification toggle button click
 * Enables/disables all notifications
 * @listens click
 */
if (notificationToggle) {
  notificationToggle.addEventListener("click", () => {
    notificationSettings.enabled = !notificationSettings.enabled;
    saveNotificationSettings();
    updateNotificationIcon();

    if (notificationSettings.enabled) {
      // Request permission if not already granted
      requestNotificationPermission();
    }
  });
  updateNotificationIcon();
}
