import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { uploadMiddleware, MAX_FILE_SIZE } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../config/paths.js';

const router = express.Router();

// POST /api/upload - Handle file upload with strict 50MB ceiling
router.post('/upload', authenticate, (req, res) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File exceeds 50MB limit' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.size === 0) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res.status(400).json({ error: 'Empty (0-byte) files are not allowed' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    res.json({
      file_path: filePath,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_mime: req.file.mimetype
    });
  });
});

export default router;

