import { db } from '../config/database.js';

export function createUser(eid, name, shift = 'Morning', role = 'User') {
  const stmt = db.prepare(`
    INSERT INTO Users (eid, name, shift, role, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);
  const result = stmt.run(eid, name, shift, role);

  return db.prepare('SELECT id, eid, name, shift, role, is_active, created_at FROM Users WHERE id = ?').get(result.lastInsertRowid);
}

export function deleteUser(userId) {
  // Check if target is Super Admin
  const user = db.prepare('SELECT eid FROM Users WHERE id = ?').get(userId);
  if (user && user.eid.toUpperCase() === 'SUPERB22') {
    throw new Error('Cannot delete Super Administrator account');
  }

  // Soft delete or delete user
  return db.prepare('DELETE FROM Users WHERE id = ?').run(userId);
}

export function deleteGroupMessage(messageId) {
  // Only allow deleting group messages (recipient_id must be NULL and group_id must be NOT NULL)
  const msg = db.prepare('SELECT group_id, recipient_id FROM Messages WHERE id = ?').get(messageId);
  if (!msg) {
    throw new Error('Message not found');
  }
  if (!msg.group_id) {
    throw new Error('Direct 1-on-1 messages are strictly confidential and cannot be deleted by Admin');
  }

  db.prepare(`
    UPDATE Messages
    SET is_deleted = 1
    WHERE id = ?
  `).run(messageId);

  return { message_id: messageId, group_id: msg.group_id };
}

export function deleteGroup(groupId) {
  const group = db.prepare('SELECT id FROM Groups WHERE id = ?').get(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Delete all messages in the group
  db.prepare('DELETE FROM Messages WHERE group_id = ?').run(groupId);

  // Delete the group
  db.prepare('DELETE FROM Groups WHERE id = ?').run(groupId);

  return { group_id: groupId };
}

