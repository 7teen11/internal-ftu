import express from 'express';
import { getPublicRoster, authenticateUser, clearSession } from '../services/userService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/auth/roster - Public roster for login selector
router.get('/roster', (req, res) => {
  try {
    const roster = getPublicRoster();
    res.json(roster);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Login with name & password/EID
router.post('/login', (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password/EID are required' });
    }

    const authResult = authenticateUser(name.trim(), password.trim());
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    res.json({
      token: authResult.token,
      user: authResult.user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me - Verify current session
router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    eid: req.user.eid,
    name: req.user.name,
    shift: req.user.shift,
    role: req.user.role
  });
});

// POST /api/auth/logout - End session
router.post('/logout', authenticate, (req, res) => {
  try {
    clearSession(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

