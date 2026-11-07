import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getUserGroups, createGroup, getGroupById, addGroupMembers } from '../services/chatService.js';

const router = express.Router();

// GET /api/groups - Get groups current user belongs to (Admins see all peer groups for moderation)
router.get('/', authenticate, (req, res) => {
  try {
    const groups = getUserGroups(req.user.id, req.user.role);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups - Create a peer group
router.post('/', authenticate, (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const memberIds = Array.isArray(members) ? members.map(m => parseInt(m, 10)).filter(m => !isNaN(m)) : [];
    const group = createGroup(name.trim(), req.user.id, memberIds);

    const io = req.app.get('io');
    if (io) {
      const allMembers = JSON.parse(group.members || '[]');
      allMembers.forEach((uid) => {
        io.to(`user_${uid}`).emit('group_updated', group);
      });
    }

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/members - Any peer group member can invite colleagues
router.post('/:id/members', authenticate, (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const group = getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const currentMembers = JSON.parse(group.members || '[]');
    if (!currentMembers.includes(req.user.id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only group members can invite participants' });
    }

    const { members } = req.body;
    const memberIds = Array.isArray(members) ? members.map(m => parseInt(m, 10)).filter(m => !isNaN(m)) : [];
    const updatedGroup = addGroupMembers(groupId, memberIds);

    const io = req.app.get('io');
    if (io && updatedGroup) {
      const allMembers = JSON.parse(updatedGroup.members || '[]');
      allMembers.forEach((uid) => {
        io.to(`user_${uid}`).emit('group_updated', updatedGroup);
      });
    }

    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id - Get single group
router.get('/:id', authenticate, (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const group = getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

