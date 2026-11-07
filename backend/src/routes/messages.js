import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDirectMessages, getGroupMessages } from '../services/chatService.js';
import { getFullDirectory } from '../services/userService.js';

const router = express.Router();

// GET /api/users/directory - All active employees for EID Directory
router.get('/directory', authenticate, (req, res) => {
  try {
    const directory = getFullDirectory();
    res.json(directory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/direct/:otherUserId - Get private 1-on-1 messages
router.get('/direct/:otherUserId', authenticate, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId, 10);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const messages = getDirectMessages(currentUserId, otherUserId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/group/:groupId - Get group chat messages
router.get('/group/:groupId', authenticate, (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const messages = getGroupMessages(groupId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

