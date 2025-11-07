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
    if (currentChat.type === 'room' && currentChat.name === room) {
        outputMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in active chats
        const chatId = `room_${room}`;
        if (!activeChats.has(chatId)) {
            activeChats.set(chatId, {
                type: 'room',
                name: room,
                messages: []
            });
        }
        activeChats.get(chatId).messages.push(message);
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
        showChatNotification(chatId, otherUser, message.message);
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
        showChatNotification(chatId, groupName, message.message);
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
        element.appendChild(li);
    });
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
}

// Update active chats list
function updateActiveChatsList() {
    activeChatsList.innerHTML = '';
    
    // Add room chat
    const roomLi = document.createElement('li');
    roomLi.textContent = `Room: ${room}`;
    roomLi.classList.add('active-chat-item');
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
            li.textContent = `Private: ${chatData.name}`;
            li.classList.add('active-chat-item');
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
            li.textContent = `Group: ${chatData.name}`;
            li.classList.add('active-chat-item');
            li.style.cursor = 'pointer';
            if (currentChat.type === 'group' && currentChat.name === chatData.name) {
                li.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
            li.addEventListener('click', () => switchToGroupChat(chatData.name));
            activeChatsList.appendChild(li);
        }
    });
}

// Show chat notification
function showChatNotification(chatId, chatName, messagePreview) {
    // You can implement a more sophisticated notification system here
    console.log(`New message in ${chatName}: ${messagePreview}`);
}

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
