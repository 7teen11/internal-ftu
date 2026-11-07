import { db } from '../config/database.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Session token required' });
  }

  const stmt = db.prepare(`
    SELECT id, eid, name, shift, role, is_active, current_session_token
    FROM Users
    WHERE current_session_token = ? AND is_active = 1
  `);
  const user = stmt.get(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or revoked session. Please log in again.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

