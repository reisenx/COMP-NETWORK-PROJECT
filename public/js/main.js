const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const roomUserList = document.getElementById('room-users');
const allUserList = document.getElementById('all-users');
const groupsList = document.getElementById('groups-list');
const activeChatsList = document.getElementById('active-chats');
const createGroupBtn = document.getElementById('create-group-btn');
const newGroupNameInput = document.getElementById('new-group-name');
const currentChatType = document.getElementById('current-chat-type');
const currentChatName = document.getElementById('current-chat-name');

//Get username and room from URL
const {username , room} = Qs.parse(location.search,{
    ignoreQueryPrefix: true
});

const socket = io();

// Current chat state
let currentChat = {
    type: 'room', // 'room', 'private', 'group'
    name: room,
    target: null // for private messages
};

// Store active chats
const activeChats = new Map(); // key: chatId, value: {type, name, messages}

// Track which groups the user is a member of
const userGroups = new Set(); // Set of group names

// Handle duplicate username
socket.on('joinError', (errorMessage) => {
  alert(errorMessage);
  window.location.href = 'index.html';
});

//Join chat room
socket.emit('joinRoom' , {username,room})

//Get room history when joining
socket.on('roomHistory', ({ room, messages }) => {
    if (room === currentChat.name && currentChat.type === 'room') {
        // Load history into active chats
        const chatId = `room_${room}`;
        if (!activeChats.has(chatId)) {
            activeChats.set(chatId, {
                type: 'room',
                name: room,
                messages: []
            });
        }
        activeChats.get(chatId).messages = messages;
        // Display messages
        chatMessages.innerHTML = '';
        messages.forEach(msg => outputMessage(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

//Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUserList(users, roomUserList);
    makeUsersClickable(allUserList);
});

// event function to output user list
socket.on('allUsers', ({ users }) => {
    outputUserList(users, allUserList);
    makeUsersClickable(allUserList);
});

// Message from server (room messages)
socket.on('message', message => {
    const chatId = `room_${room}`;
    
    if (currentChat.type === 'room' && currentChat.name === room) {
        outputMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in active chats
        if (!activeChats.has(chatId)) {
            activeChats.set(chatId, {
                type: 'room',
                name: room,
                messages: []
            });
        }
        activeChats.get(chatId).messages.push(message);
    } else {
        // Store message but show notification
        if (!activeChats.has(chatId)) {
            activeChats.set(chatId, {
                type: 'room',
                name: room,
                messages: []
            });
        }
        activeChats.get(chatId).messages.push(message);
        showChatNotification(chatId, room, message.message, message.username);
    }
});

// R7: Private message handler
socket.on('privateMessage', ({ from, to, message, room: pmRoom }) => {
    const chatId = pmRoom || `${from}_pm_${to || username}`;
    const otherUser = from === username ? (to || 'Unknown') : from;
    
    // Store message
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'private',
            name: otherUser,
            messages: []
        });
        updateActiveChatsList();
    }
    
    activeChats.get(chatId).messages.push(message);
    
    // Display if this is the current chat
    if (currentChat.type === 'private' && currentChat.target === otherUser) {
        outputMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        // Show notification
        showChatNotification(chatId, otherUser, message.message, from);
    }
});

socket.on('privateMessageError', (error) => {
    alert(error);
});

// Private chat history
socket.on('privateHistory', ({ otherUsername, messages }) => {
    const chatId = getChatId({
        type: 'private',
        name: `Private: ${otherUsername}`,
        target: otherUsername
    });
    
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'private',
            name: otherUsername,
            messages: []
        });
    }
    activeChats.get(chatId).messages = messages;
    
    // Display if this is the current chat
    if (currentChat.type === 'private' && currentChat.target === otherUsername) {
        chatMessages.innerHTML = '';
        messages.forEach(msg => outputMessage(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// R8, R9: Groups handlers
socket.on('allGroups', ({ groups }) => {
    // Update userGroups set based on member lists
    groups.forEach(group => {
        if (group.members.includes(username)) {
            userGroups.add(group.name);
        }
    });
    outputGroupsList(groups);
});

socket.on('groupCreated', ({ group }) => {
    alert(`Group "${group.name}" created successfully!`);
    newGroupNameInput.value = '';
    
    // Add user to groups set
    userGroups.add(group.name);
    
    // Add group to active chats
    const chatId = `group_${group.name}`;
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'group',
            name: group.name,
            messages: []
        });
        updateActiveChatsList();
    }
    
    // Automatically switch to the new group chat
    switchToGroupChat(group.name);
    
    socket.emit('requestGroups');
});

socket.on('groupJoined', ({ groupName, username: joinedUser }) => {
    if (joinedUser !== username) {
        // Show notification that someone joined
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const notification = {
            username: 'System',
            message: `${joinedUser} joined group "${groupName}"`,
            timestamp: timestamp
        };
        if (currentChat.type === 'group' && currentChat.name === groupName) {
            outputMessage(notification);
        }
    }
});

socket.on('groupJoinedSuccess', ({ group }) => {
    alert(`You joined group "${group.name}"!`);
    
    // Add to user groups set
    userGroups.add(group.name);
    
    const chatId = `group_${group.name}`;
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'group',
            name: group.name,
            messages: []
        });
        updateActiveChatsList();
    }
    
    // Refresh groups list to update UI
    socket.emit('requestGroups');
    
    // Automatically switch to the group chat
    switchToGroupChat(group.name);
});

socket.on('groupMessage', ({ groupName, message }) => {
    // If we receive a group message, we must be a member
    userGroups.add(groupName);
    
    const chatId = `group_${groupName}`;
    
    // Store message
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'group',
            name: groupName,
            messages: []
        });
        updateActiveChatsList();
    }
    
    activeChats.get(chatId).messages.push(message);
    
    // Display if this is the current chat
    if (currentChat.type === 'group' && currentChat.name === groupName) {
        outputMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        showChatNotification(chatId, groupName, message.message, message.username);
    }
});

socket.on('groupError', (error) => {
    alert(error);
    // If error is about not being a member, remove from userGroups
    if (error.includes('not a member')) {
        // Try to remove from userGroups if it exists
        const groupName = currentChat.type === 'group' ? currentChat.name : null;
        if (groupName) {
            userGroups.delete(groupName);
        }
    }
});

// Group chat history
socket.on('groupHistory', ({ groupName, messages }) => {
    const chatId = `group_${groupName}`;
    
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'group',
            name: groupName,
            messages: []
        });
    }
    activeChats.get(chatId).messages = messages;
    
    // Display if this is the current chat
    if (currentChat.type === 'group' && currentChat.name === groupName) {
        chatMessages.innerHTML = '';
        messages.forEach(msg => outputMessage(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = e.target.elements.msg.value.trim();
    if (!msg) return;

    if (currentChat.type === 'room') {
        socket.emit('chatMessage', msg);
    } else if (currentChat.type === 'private') {
        socket.emit('privateMessage', {
            toUsername: currentChat.target,
            message: msg
        });
    } else if (currentChat.type === 'group') {
        // Check if user is a member before sending
        if (!userGroups.has(currentChat.name)) {
            alert('You are not a member of this group. Please join first.');
            return;
        }
        socket.emit('groupMessage', {
            groupName: currentChat.name,
            message: msg
        });
    }

    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Create group button
createGroupBtn.addEventListener('click', () => {
    const groupName = newGroupNameInput.value.trim();
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    socket.emit('createGroup', { groupName });
});

// Enter key for create group
newGroupNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createGroupBtn.click();
    }
});

// Output message to DOM
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.timestamp}</span> </p>
    <p class="text">
    ${message.message}
    </p>`;
    chatMessages.appendChild(div);
}

// Clear messages and load chat history
function loadChatHistory(chat) {
    chatMessages.innerHTML = '';
    const chatId = getChatId(chat);
    if (activeChats.has(chatId)) {
        const chatData = activeChats.get(chatId);
        chatData.messages.forEach(msg => outputMessage(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function getChatId(chat) {
    if (chat.type === 'room') {
        return `room_${chat.name}`;
    } else if (chat.type === 'private') {
        const sorted = [username, chat.target].sort();
        return `${sorted[0]}_pm_${sorted[1]}`;
    } else if (chat.type === 'group') {
        return `group_${chat.name}`;
    }
}

//add room name to DOM
function outputRoomName(room){
    roomName.innerText = room;
}

//add users to DOM
function outputUsers(users){
    userList.innerHTML=`
    ${users.map(user => `<li>${user.username}</li>`).join('')}`
}

// show user list function
function outputUserList(users, element) {
    element.innerHTML = ''; 
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerText = user.username;
        li.setAttribute('data-username', user.username);
        li.classList.add('clickable-user');
        
        // Set chat ID for badge tracking (only for all users list, not room users)
        if (element === allUserList && user.username !== username) {
            const sorted = [username, user.username].sort();
            const chatId = `${sorted[0]}_pm_${sorted[1]}`;
            li.setAttribute('data-chat-id', chatId);
        }
        
        element.appendChild(li);
    });
    
    // Update badges after creating user list
    if (element === allUserList) {
        setTimeout(() => updateUnreadBadges(), 0);
    }
}

// Make users clickable for private messages (R7)
function makeUsersClickable(element) {
    element.querySelectorAll('.clickable-user').forEach(li => {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            const targetUsername = li.getAttribute('data-username');
            if (targetUsername !== username) {
                switchToPrivateChat(targetUsername);
            }
        });
    });
}

// Switch to private chat
function switchToPrivateChat(targetUsername) {
    currentChat = {
        type: 'private',
        name: `Private: ${targetUsername}`,
        target: targetUsername
    };
    
    const chatId = getChatId(currentChat);
    
    // Clear unread count when switching to this chat
    clearUnreadCount(chatId);
    
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'private',
            name: targetUsername,
            messages: []
        });
        updateActiveChatsList();
        // Request history from server
        socket.emit('requestPrivateHistory', { otherUsername: targetUsername });
    } else {
        // Load from local cache first, then request from server to sync
        updateChatContext();
        loadChatHistory(currentChat);
        socket.emit('requestPrivateHistory', { otherUsername: targetUsername });
    }
    
    updateChatContext();
}

// Switch to room chat
function switchToRoomChat() {
    currentChat = {
        type: 'room',
        name: room,
        target: null
    };
    
    // Clear unread count when switching to this chat
    const chatId = getChatId(currentChat);
    clearUnreadCount(chatId);
    
    updateChatContext();
    loadChatHistory(currentChat);
}

// Switch to group chat
function switchToGroupChat(groupName) {
    // Check if user is a member
    if (!userGroups.has(groupName)) {
        alert('You are not a member of this group. Joining now...');
        socket.emit('joinGroup', { groupName: groupName });
        return; // Will switch after join success
    }
    
    currentChat = {
        type: 'group',
        name: groupName,
        target: null
    };
    
    const chatId = getChatId(currentChat);
    
    // Clear unread count when switching to this chat
    clearUnreadCount(chatId);
    
    if (!activeChats.has(chatId)) {
        activeChats.set(chatId, {
            type: 'group',
            name: groupName,
            messages: []
        });
        updateActiveChatsList();
        // Request history from server
        socket.emit('requestGroupHistory', { groupName: groupName });
    } else {
        // Load from local cache first, then request from server to sync
        updateChatContext();
        loadChatHistory(currentChat);
        socket.emit('requestGroupHistory', { groupName: groupName });
    }
    
    updateChatContext();
}

// Update chat context display
function updateChatContext() {
    if (currentChat.type === 'room') {
        currentChatType.textContent = 'Room Chat';
        currentChatName.textContent = currentChat.name;
    } else if (currentChat.type === 'private') {
        currentChatType.textContent = 'Private Chat';
        currentChatName.textContent = currentChat.target;
    } else if (currentChat.type === 'group') {
        currentChatType.textContent = 'Group Chat';
        currentChatName.textContent = currentChat.name;
    }
}

// R9: Output groups list
function outputGroupsList(groups) {
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No groups yet';
        li.style.opacity = '0.6';
        groupsList.appendChild(li);
        return;
    }
    
    groups.forEach(group => {
        const li = document.createElement('li');
        li.classList.add('group-item');
        li.setAttribute('data-chat-id', `group_${group.name}`);
        
        const groupNameDiv = document.createElement('div');
        groupNameDiv.textContent = group.name;
        groupNameDiv.style.fontWeight = 'bold';
        
        const membersDiv = document.createElement('div');
        membersDiv.textContent = `Members: ${group.members.join(', ')}`;
        membersDiv.style.fontSize = '0.85em';
        membersDiv.style.opacity = '0.8';
        membersDiv.style.marginTop = '4px';
        
        const isMember = userGroups.has(group.name);
        
        const joinBtn = document.createElement('button');
        if (isMember) {
            joinBtn.textContent = 'Joined';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.6';
        } else {
            joinBtn.textContent = 'Join';
            joinBtn.addEventListener('click', () => {
                socket.emit('joinGroup', { groupName: group.name });
            });
        }
        joinBtn.classList.add('btn-small');
        joinBtn.style.marginTop = '8px';
        
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'Open';
        viewBtn.classList.add('btn-small');
        viewBtn.style.marginTop = '8px';
        viewBtn.style.marginLeft = '8px';
        viewBtn.addEventListener('click', () => {
            if (isMember) {
                switchToGroupChat(group.name);
            } else {
                // Auto-join and then open
                socket.emit('joinGroup', { groupName: group.name });
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

// Update active chats list
function updateActiveChatsList() {
    activeChatsList.innerHTML = '';
    
    // Add room chat
    const roomLi = document.createElement('li');
    const roomText = document.createTextNode(`Room: ${room}`);
    roomLi.appendChild(roomText);
    roomLi.classList.add('active-chat-item');
    roomLi.setAttribute('data-chat-id', `room_${room}`);
    roomLi.style.cursor = 'pointer';
    if (currentChat.type === 'room') {
        roomLi.style.backgroundColor = 'rgba(255,255,255,0.2)';
    }
    roomLi.addEventListener('click', () => switchToRoomChat());
    activeChatsList.appendChild(roomLi);
    
    // Add private chats
    activeChats.forEach((chatData, chatId) => {
        if (chatData.type === 'private') {
            const li = document.createElement('li');
            const privateText = document.createTextNode(`Private: ${chatData.name}`);
            li.appendChild(privateText);
            li.classList.add('active-chat-item');
            li.setAttribute('data-chat-id', chatId);
            li.style.cursor = 'pointer';
            if (currentChat.type === 'private' && currentChat.target === chatData.name) {
                li.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
            li.addEventListener('click', () => switchToPrivateChat(chatData.name));
            activeChatsList.appendChild(li);
        }
    });
    
    // Add group chats
    activeChats.forEach((chatData, chatId) => {
        if (chatData.type === 'group') {
            const li = document.createElement('li');
            const groupText = document.createTextNode(`Group: ${chatData.name}`);
            li.appendChild(groupText);
            li.classList.add('active-chat-item');
            li.setAttribute('data-chat-id', chatId);
            li.style.cursor = 'pointer';
            if (currentChat.type === 'group' && currentChat.name === chatData.name) {
                li.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
            li.addEventListener('click', () => switchToGroupChat(chatData.name));
            activeChatsList.appendChild(li);
        }
    });
    
    // Update badges after adding all items
    setTimeout(() => updateUnreadBadges(), 0);
}

// ==================== NOTIFICATION SYSTEM ====================

// Notification settings (stored in localStorage)
let notificationSettings = {
    browser: true,
    sound: true,
    enabled: true
};

// Load notification settings from localStorage
function loadNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
        notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
    }
}

// Save notification settings to localStorage
function saveNotificationSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

// Track unread messages per chat
const unreadCounts = new Map(); // chatId -> count

// Request notification permission on page load
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Check if page is focused
function isPageFocused() {
    return document.hasFocus();
}

// Play notification sound
function playNotificationSound() {
    if (!notificationSettings.sound) return;
    
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.log('Could not play notification sound:', e);
    }
}

// Show browser notification
function showBrowserNotification(chatName, messagePreview, senderName) {
    if (!notificationSettings.browser || !notificationSettings.enabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    // Only show notification if page is not focused
    if (isPageFocused()) return;
    
    const title = `New message from ${senderName || chatName}`;
    const body = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
    
    const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico', // You can add a favicon later
        badge: '/favicon.ico',
        tag: chatName, // Group notifications by chat
        requireInteraction: false
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

// Increment unread count for a chat
function incrementUnreadCount(chatId) {
    const current = unreadCounts.get(chatId) || 0;
    unreadCounts.set(chatId, current + 1);
    updateUnreadBadges();
}

// Clear unread count for a chat
function clearUnreadCount(chatId) {
    unreadCounts.delete(chatId);
    updateUnreadBadges();
}

// Update unread badges in UI
function updateUnreadBadges() {
    // Update active chats list
    activeChatsList.querySelectorAll('.active-chat-item').forEach(item => {
        const chatId = item.getAttribute('data-chat-id');
        if (!chatId) return;
        
        const count = unreadCounts.get(chatId) || 0;
        let badge = item.querySelector('.unread-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'unread-badge';
                item.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    });
    
    // Update groups list
    groupsList.querySelectorAll('.group-item').forEach(item => {
        const chatId = item.getAttribute('data-chat-id');
        if (!chatId) {
            // Fallback: try to get from group name
            const groupNameDiv = item.querySelector('div');
            if (groupNameDiv) {
                const groupName = groupNameDiv.textContent.trim();
                const computedChatId = `group_${groupName}`;
                item.setAttribute('data-chat-id', computedChatId);
                updateBadgeForItem(item, computedChatId);
            }
        } else {
            updateBadgeForItem(item, chatId);
        }
    });
    
    // Update all users list (for private chats)
    allUserList.querySelectorAll('.clickable-user').forEach(item => {
        const targetUsername = item.getAttribute('data-username');
        if (targetUsername && targetUsername !== username) {
            const sorted = [username, targetUsername].sort();
            const chatId = `${sorted[0]}_pm_${sorted[1]}`;
            item.setAttribute('data-chat-id', chatId);
            updateBadgeForItem(item, chatId);
        }
    });
}

// Helper function to update badge for an item
function updateBadgeForItem(item, chatId) {
    const count = unreadCounts.get(chatId) || 0;
    let badge = item.querySelector('.unread-badge');
    
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'unread-badge';
            item.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
        badge.remove();
    }
}

// Show chat notification (comprehensive)
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

// Initialize
updateChatContext();
switchToRoomChat();

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

// Get saved theme or default to light
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

// Toggle theme
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });
}

function updateIcon(theme) {
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Notification toggle functionality
const notificationToggle = document.getElementById('notification-toggle');
const notificationIcon = document.getElementById('notification-icon');

function updateNotificationIcon() {
    if (notificationIcon) {
        if (notificationSettings.enabled) {
            notificationIcon.classList.remove('fa-bell-slash');
            notificationIcon.classList.add('fa-bell');
            notificationToggle.title = 'Disable notifications';
        } else {
            notificationIcon.classList.remove('fa-bell');
            notificationIcon.classList.add('fa-bell-slash');
            notificationToggle.title = 'Enable notifications';
        }
    }
}

if (notificationToggle) {
    notificationToggle.addEventListener('click', () => {
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
