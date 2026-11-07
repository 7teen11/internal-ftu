import { db } from '../config/database.js';

export function getDirectMessages(user1Id, user2Id, limit = 100) {
  const stmt = db.prepare(`
    SELECT m.id, m.sender_id, m.recipient_id, m.content, 
           m.file_path, m.file_name, m.file_size, m.file_mime,
           m.is_read, m.created_at,
           u.name as sender_name, u.eid as sender_eid
    FROM Messages m
    JOIN Users u ON m.sender_id = u.id
    WHERE (
      (m.sender_id = ? AND m.recipient_id = ?) OR
      (m.sender_id = ? AND m.recipient_id = ?)
    ) AND m.is_deleted = 0
    ORDER BY m.id ASC
    LIMIT ?
  `);
  return stmt.all(user1Id, user2Id, user2Id, user1Id, limit);
}

export function saveDirectMessage(senderId, recipientId, content, file = null) {
  const stmt = db.prepare(`
    INSERT INTO Messages (
      sender_id, recipient_id, content, 
      file_path, file_name, file_size, file_mime, 
      is_read, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
  `);

  const filePath = file?.path ? file.path : null;
  const fileName = file?.name ? file.name : null;
  const fileSize = file?.size ? file.size : null;
  const fileMime = file?.mime ? file.mime : null;

  const result = stmt.run(
    senderId,
    recipientId,
    content || '',
    filePath,
    fileName,
    fileSize,
    fileMime
  );

  return db.prepare(`
    SELECT m.*, u.name as sender_name, u.eid as sender_eid
    FROM Messages m
    JOIN Users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);
}

export function getGroupMessages(groupId, limit = 100) {
  const stmt = db.prepare(`
    SELECT m.id, m.sender_id, m.group_id, m.content, 
           m.file_path, m.file_name, m.file_size, m.file_mime,
           m.is_deleted, m.created_at,
           u.name as sender_name, u.eid as sender_eid
    FROM Messages m
    JOIN Users u ON m.sender_id = u.id
    WHERE m.group_id = ? AND m.is_deleted = 0
    ORDER BY m.id ASC
    LIMIT ?
  `);
  return stmt.all(groupId, limit);
}

export function saveGroupMessage(groupId, senderId, content, file = null) {
  const stmt = db.prepare(`
    INSERT INTO Messages (
      group_id, sender_id, content, 
      file_path, file_name, file_size, file_mime, 
      is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);

  const filePath = file?.path ? file.path : null;
  const fileName = file?.name ? file.name : null;
  const fileSize = file?.size ? file.size : null;
  const fileMime = file?.mime ? file.mime : null;

  const result = stmt.run(
    groupId,
    senderId,
    content || '',
    filePath,
    fileName,
    fileSize,
    fileMime
  );

  return db.prepare(`
    SELECT m.*, u.name as sender_name, u.eid as sender_eid
    FROM Messages m
    JOIN Users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);
}

export function getUserGroups(userId, userRole = 'User') {
  const stmt = db.prepare(`
    SELECT id, name, created_by, members, created_at
    FROM Groups
    ORDER BY created_at DESC
  `);
  const allGroups = stmt.all();

  if (userRole === 'Admin') {
    return allGroups;
  }

  // Filter groups where userId is in members JSON array
  return allGroups.filter(g => {
    try {
      const memberList = JSON.parse(g.members || '[]');
      return memberList.includes(userId);
    } catch {
      return false;
    }
  });
}

export function createGroup(name, createdBy, memberIds = []) {
  // Ensure creator is in the members list
  const uniqueMembers = Array.from(new Set([createdBy, ...memberIds]));

  const stmt = db.prepare(`
    INSERT INTO Groups (name, created_by, members)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(name, createdBy, JSON.stringify(uniqueMembers));

  return db.prepare('SELECT * FROM Groups WHERE id = ?').get(result.lastInsertRowid);
}

export function getGroupById(groupId) {
  return db.prepare('SELECT * FROM Groups WHERE id = ?').get(groupId);
}

export function addGroupMembers(groupId, memberIds = []) {
  const group = getGroupById(groupId);
  if (!group) return null;

  let existing = [];
  try {
    existing = JSON.parse(group.members || '[]');
  } catch {
    existing = [];
  }

  const updated = Array.from(new Set([...existing, ...memberIds]));
  db.prepare('UPDATE Groups SET members = ? WHERE id = ?').run(JSON.stringify(updated), groupId);

  return getGroupById(groupId);
}


