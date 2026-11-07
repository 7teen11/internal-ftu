import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createUser, deleteUser, deleteGroupMessage, deleteGroup } from '../services/adminService.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/users - Create new employee
router.post('/users', (req, res) => {
  try {
    const { eid, name, shift, role } = req.body;
    if (!eid || !name) {
      return res.status(400).json({ error: 'EID and Name are required' });
    }

    const newUser = createUser(
      eid.trim(),
      name.trim(),
      shift ? shift.trim() : 'Morning',
      role && role === 'Admin' ? 'Admin' : 'User'
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('user_roster_updated', { type: 'create', user: newUser });
    }

    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An employee with this EID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete an employee
router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    deleteUser(userId);

    const io = req.app.get('io');
    if (io) {
      // Disconnect active socket if any
      io.to(`user_${userId}`).emit('session_terminated', {
        reason: 'Account has been removed by administrator'
      });
      io.in(`user_${userId}`).disconnectSockets(true);
      io.emit('user_roster_updated', { type: 'delete', userId });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/messages/:id - Moderate (delete) group message
router.delete('/messages/:id', (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    const result = deleteGroupMessage(messageId);

    const io = req.app.get('io');
    if (io) {
      io.to(`group_${result.group_id}`).emit('message_deleted', {
        message_id: result.message_id,
        group_id: result.group_id
      });
    }

    res.json({ success: true, message: 'Message moderated successfully' });
  } catch (err) {
    if (err.message.includes('confidential')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/groups/:id - Delete group
router.delete('/groups/:id', (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const result = deleteGroup(groupId);

    const io = req.app.get('io');
    if (io) {
      io.to(`group_${result.group_id}`).emit('group_deleted', {
        group_id: result.group_id
      });
    }

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

