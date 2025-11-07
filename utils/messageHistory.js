// messageHistory.js - Store chat history for rooms, private chats, and groups
const formatMessage = require('./message');

// Store messages by chat ID
// Format: { roomName: [messages], privateRoomId: [messages], groupName: [messages] }
const messageHistory = new Map();

// Maximum messages to keep per chat (to prevent memory issues)
const MAX_MESSAGES_PER_CHAT = 1000;

function addRoomMessage(roomName, username, message) {
  const key = `room_${roomName}`;
  if (!messageHistory.has(key)) {
    messageHistory.set(key, []);
  }
  
  const messages = messageHistory.get(key);
  const formattedMessage = formatMessage(username, message);
  // Add timestamp for filtering
  formattedMessage._timestamp = Date.now();
  messages.push(formattedMessage);
  
  // Keep only the last MAX_MESSAGES_PER_CHAT messages
  if (messages.length > MAX_MESSAGES_PER_CHAT) {
    messages.shift(); // Remove oldest message
  }
  
  return formattedMessage;
}

function addPrivateMessage(user1, user2, username, message) {
  // Create consistent private room ID (sorted usernames)
  const sorted = [user1, user2].sort();
  const key = `${sorted[0]}_pm_${sorted[1]}`;
  
  if (!messageHistory.has(key)) {
    messageHistory.set(key, []);
  }
  
  const messages = messageHistory.get(key);
  const formattedMessage = formatMessage(username, message);
  // Add timestamp for filtering
  formattedMessage._timestamp = Date.now();
  messages.push(formattedMessage);
  
  if (messages.length > MAX_MESSAGES_PER_CHAT) {
    messages.shift();
  }
  
  return formattedMessage;
}

function addGroupMessage(groupName, username, message) {
  const key = `group_${groupName}`;
  if (!messageHistory.has(key)) {
    messageHistory.set(key, []);
  }
  
  const messages = messageHistory.get(key);
  const formattedMessage = formatMessage(username, message);
  // Add timestamp for filtering
  formattedMessage._timestamp = Date.now();
  messages.push(formattedMessage);
  
  if (messages.length > MAX_MESSAGES_PER_CHAT) {
    messages.shift();
  }
  
  return formattedMessage;
}

function getRoomHistory(roomName, joinTime = null) {
  const key = `room_${roomName}`;
  const allMessages = messageHistory.get(key) || [];
  
  // If joinTime is provided, filter messages sent after join time
  if (joinTime !== null) {
    return allMessages.filter(msg => msg._timestamp >= joinTime);
  }
  
  return allMessages;
}

function getPrivateHistory(user1, user2, joinTime = null) {
  const sorted = [user1, user2].sort();
  const key = `${sorted[0]}_pm_${sorted[1]}`;
  const allMessages = messageHistory.get(key) || [];
  
  // If joinTime is provided, filter messages sent after join time
  if (joinTime !== null) {
    return allMessages.filter(msg => msg._timestamp >= joinTime);
  }
  
  return allMessages;
}

function getGroupHistory(groupName, joinTime = null) {
  const key = `group_${groupName}`;
  const allMessages = messageHistory.get(key) || [];
  
  // If joinTime is provided, filter messages sent after join time
  if (joinTime !== null) {
    return allMessages.filter(msg => msg._timestamp >= joinTime);
  }
  
  return allMessages;
}

function clearRoomHistory(roomName) {
  const key = `room_${roomName}`;
  messageHistory.delete(key);
}

function clearPrivateHistory(user1, user2) {
  const sorted = [user1, user2].sort();
  const key = `${sorted[0]}_pm_${sorted[1]}`;
  messageHistory.delete(key);
}

function clearGroupHistory(groupName) {
  const key = `group_${groupName}`;
  messageHistory.delete(key);
}

module.exports = {
  addRoomMessage,
  addPrivateMessage,
  addGroupMessage,
  getRoomHistory,
  getPrivateHistory,
  getGroupHistory,
  clearRoomHistory,
  clearPrivateHistory,
  clearGroupHistory
};

