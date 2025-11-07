// users.js
const users = [];
const usernames = new Set();

function userJoin(id, username, room) {
  const name = String(username || "").trim();
  const roomName = String(room || "").trim();
  
  // Validate username
  if (!name) return { error: "Username is required" };
  if (name.length < 1) return { error: "Username cannot be empty" };
  if (name.length > 20) return { error: "Username must be 20 characters or less" };
  if (name.includes('  ')) return { error: "Username cannot contain consecutive spaces" };
  
  // Validate room
  if (!roomName) return { error: "Room is required" };
  if (roomName.length < 1) return { error: "Room name cannot be empty" };
  
  const key = name.toLowerCase();
  
  // Remove any existing user with this socket.id first (handles rejoin scenarios)
  const existingUserIndex = users.findIndex(u => u.id === id);
  if (existingUserIndex !== -1) {
    const existingUser = users[existingUserIndex];
    users.splice(existingUserIndex, 1);
    // Remove from Set only if username is changing
    if (existingUser._key && existingUser._key !== key) {
      usernames.delete(existingUser._key);
    }
  }
  
  // Check for duplicate username (case-insensitive) - must be a DIFFERENT socket
  if (usernames.has(key)) {
    const existingUser = users.find(u => u._key === key);
    if (existingUser && existingUser.id !== id) {
      // Username is taken by a DIFFERENT socket - reject
      console.log(`[DUPLICATE REJECTED] Username "${name}" (key: "${key}") is already taken by socket ${existingUser.id}, rejecting socket ${id}`);
      return { error: `Username "${name}" is already taken. Please choose a different username.` };
    }
    // If existingUser.id === id, it means same socket rejoining with same username - allow it
    // If existingUser is null, it's an orphaned entry in Set - we'll clean it up below
  }
  
  // Clean up orphaned Set entries (username in Set but not in users array)
  if (usernames.has(key)) {
    const existingUser = users.find(u => u._key === key);
    if (!existingUser) {
      // Orphaned entry - remove it
      usernames.delete(key);
    }
  }
  
  // Add the new user
  const user = { id, username: name, room: roomName, _key: key };
  users.push(user);
  usernames.add(key);
  console.log(`[USER JOINED] Username: "${name}" (key: "${key}"), Socket: ${id}, Total users: ${users.length}, Usernames in Set: ${usernames.size}`);
  return user;
}
function getCurrentUser(id) { return users.find(u => u.id === id); }
function userLeave(id) {
  const i = users.findIndex(u => u.id === id);
  if (i !== -1) {
    const [removed] = users.splice(i, 1);
    if (removed?._key) usernames.delete(removed._key);
    return removed;
  }
}
function getRoomUsers(room) {
  const roomName = String(room || "").trim();
  return users.filter(u => u.room === roomName);
}
function getAllUsers() { return users; }

module.exports = { userJoin, getCurrentUser, userLeave, getRoomUsers, getAllUsers };
