// users.js
const users = [];
const usernames = new Set();

function userJoin(id, username, room) {
  const name = String(username || "").trim();
  const roomName = String(room || "").trim();
  const key = name.toLowerCase();
  if (!name) return { error: "Username is required" };
  if (!roomName) return { error: "Room is required" };
  if (usernames.has(key)) return { error: "Username is already taken" };
  const user = { id, username: name, room: roomName, _key: key };
  users.push(user);
  usernames.add(key);
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
