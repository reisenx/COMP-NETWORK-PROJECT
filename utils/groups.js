// groups.js
const groups = [];

function createGroup(groupName, creatorUsername, creatorId) {
  const name = String(groupName || "").trim();
  if (!name) return { error: "Group name is required" };

  // Check if group name already exists
  if (groups.find((g) => g.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Group name already exists" };
  }

  const joinTime = Date.now();
  const group = {
    name: name,
    members: [{ username: creatorUsername, id: creatorId, joinTime }],
    createdAt: new Date(),
  };

  groups.push(group);
  return { group, joinTime };
}

function getAllGroups() {
  return groups.map((g) => ({
    name: g.name,
    members: g.members.map((m) => m.username),
    memberCount: g.members.length,
  }));
}

function getGroup(groupName) {
  const name = String(groupName || "").trim();
  return groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
}

function joinGroup(groupName, username, userId) {
  const group = getGroup(groupName);
  if (!group) return { error: "Group not found" };

  // Check if user is already a member
  const existingMember = group.members.find((m) => m.id === userId);
  if (existingMember) {
    // User is already a member, return their join time
    return { group, joinTime: existingMember.joinTime || Date.now() };
  }

  // Add member with join timestamp
  const joinTime = Date.now();
  group.members.push({ username, id: userId, joinTime });
  return { group, joinTime };
}

function leaveGroup(groupName, userId) {
  const group = getGroup(groupName);
  if (!group) return { error: "Group not found" };

  const index = group.members.findIndex((m) => m.id === userId);
  if (index === -1) return { error: "You are not a member of this group" };

  group.members.splice(index, 1);

  // If group is empty, remove it
  if (group.members.length === 0) {
    const groupIndex = groups.findIndex((g) => g.name === group.name);
    if (groupIndex !== -1) {
      groups.splice(groupIndex, 1);
    }
  }

  return group;
}

function getGroupMembers(groupName) {
  const group = getGroup(groupName);
  if (!group) return [];
  return group.members;
}

function isGroupMember(groupName, userId) {
  const group = getGroup(groupName);
  if (!group) return false;
  return group.members.some((m) => m.id === userId);
}

module.exports = {
  createGroup,
  getAllGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  isGroupMember,
};
