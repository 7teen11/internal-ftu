import { db } from '../config/database.js';

export function getAllAnnouncements() {
  const stmt = db.prepare(`
    SELECT m.id, m.title, m.content, m.author_id, m.acknowledged_by, m.created_at, m.updated_at,
           u.name as author_name, u.role as author_role
    FROM MustRead m
    JOIN Users u ON m.author_id = u.id
    ORDER BY m.created_at DESC
  `);
  return stmt.all();
}

export function createAnnouncement(title, content, authorId) {
  const stmt = db.prepare(`
    INSERT INTO MustRead (title, content, author_id, acknowledged_by)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(title, content, authorId, JSON.stringify([authorId]));

  return db.prepare(`
    SELECT m.id, m.title, m.content, m.author_id, m.acknowledged_by, m.created_at, m.updated_at,
           u.name as author_name, u.role as author_role
    FROM MustRead m
    JOIN Users u ON m.author_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);
}

export function updateAnnouncement(id, title, content) {
  db.prepare(`
    UPDATE MustRead
    SET title = ?, content = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, content, id);

  return db.prepare(`
    SELECT m.id, m.title, m.content, m.author_id, m.acknowledged_by, m.created_at, m.updated_at,
           u.name as author_name, u.role as author_role
    FROM MustRead m
    JOIN Users u ON m.author_id = u.id
    WHERE m.id = ?
  `).get(id);
}

export function acknowledgeAnnouncement(id, userId) {
  const row = db.prepare('SELECT acknowledged_by FROM MustRead WHERE id = ?').get(id);
  if (!row) return null;

  let list = [];
  try {
    list = JSON.parse(row.acknowledged_by || '[]');
  } catch {
    list = [];
  }

  if (!list.includes(userId)) {
    list.push(userId);
    db.prepare('UPDATE MustRead SET acknowledged_by = ? WHERE id = ?').run(JSON.stringify(list), id);
  }

  return db.prepare(`
    SELECT m.id, m.title, m.content, m.author_id, m.acknowledged_by, m.created_at, m.updated_at,
           u.name as author_name, u.role as author_role
    FROM MustRead m
    JOIN Users u ON m.author_id = u.id
    WHERE m.id = ?
  `).get(id);
}

export function deleteAnnouncement(id) {
  return db.prepare('DELETE FROM MustRead WHERE id = ?').run(id);
}

