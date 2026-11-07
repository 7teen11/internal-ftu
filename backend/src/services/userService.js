import crypto from 'node:crypto';
import { db } from '../config/database.js';

// Public roster for login page - strictly hides EID (since EID is password)
export function getPublicRoster() {
  const stmt = db.prepare(`
    SELECT id, name, shift, role
    FROM Users
    WHERE is_active = 1
    ORDER BY role DESC, shift ASC, name ASC
  `);
  return stmt.all();
}

// Authenticated full directory for internal staff directory
export function getFullDirectory() {
  const stmt = db.prepare(`
    SELECT id, eid, name, shift, role
    FROM Users
    WHERE is_active = 1
    ORDER BY role DESC, shift ASC, name ASC
  `);
  return stmt.all();
}

export function authenticateUser(name, password) {
  const stmt = db.prepare(`
    SELECT id, eid, name, shift, role, is_active, current_session_token
    FROM Users
    WHERE name = ? AND is_active = 1
  `);
  const user = stmt.get(name);

  if (!user) {
    return { success: false, error: 'Employee not found' };
  }

  // Password verification:
  // If Super Administrator / SuperB22: password is Super123
  // For all standard employees: password is their assigned EID
  const isSuperAdmin = user.eid.toUpperCase() === 'SUPERB22';
  const expectedPassword = isSuperAdmin ? 'Super123' : user.eid;

  if (password !== expectedPassword) {
    return { success: false, error: 'Invalid password' };
  }

  // Generate new session token
  const token = 'sess_' + crypto.randomBytes(24).toString('hex');
  const oldToken = user.current_session_token;

  db.prepare(`
    UPDATE Users
    SET current_session_token = ?
    WHERE id = ?
  `).run(token, user.id);

  return {
    success: true,
    token,
    oldToken,
    user: {
      id: user.id,
      eid: user.eid,
      name: user.name,
      shift: user.shift,
      role: user.role
    }
  };
}

export function getUserById(id) {
  const stmt = db.prepare(`
    SELECT id, eid, name, shift, role, is_active, current_session_token
    FROM Users
    WHERE id = ?
  `);
  return stmt.get(id);
}

export function getUserByToken(token) {
  const stmt = db.prepare(`
    SELECT id, eid, name, shift, role, is_active
    FROM Users
    WHERE current_session_token = ? AND is_active = 1
  `);
  return stmt.get(token);
}

export function clearSession(userId) {
  db.prepare(`
    UPDATE Users
    SET current_session_token = NULL
    WHERE id = ?
  `).run(userId);
}
