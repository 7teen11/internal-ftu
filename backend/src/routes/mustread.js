import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  acknowledgeAnnouncement
} from '../services/mustreadService.js';

const router = express.Router();

// GET /api/mustread - Get all MustRead announcements
router.get('/', authenticate, (req, res) => {
  try {
    const announcements = getAllAnnouncements();
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mustread - Create announcement (Admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = createAnnouncement(title.trim(), content.trim(), req.user.id);
    
    // Broadcast via global socket emitter if available
    const io = req.app.get('io');
    if (io) {
      io.emit('new_mustread_announcement', announcement);
      io.emit('notification_bell_alert', {
        type: 'MustRead',
        title: `MustRead: ${announcement.title}`,
        body: announcement.content.slice(0, 80) + '...',
        reference_id: announcement.id,
        play_sound: true
      });
    }

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/mustread/:id - Edit announcement (Admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const updated = updateAnnouncement(id, title.trim(), content.trim());
    if (!updated) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('mustread_updated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mustread/:id/acknowledge - Employee acknowledges reading notice
router.post('/:id/acknowledge', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = acknowledgeAnnouncement(id, req.user.id);
    if (!updated) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('mustread_updated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mustread/:id - Delete announcement (Admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteAnnouncement(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('mustread_deleted', { id });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

