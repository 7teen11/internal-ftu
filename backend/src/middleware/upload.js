import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOADS_DIR } from '../config/paths.js';

// Max file size: 50MB (52,428,800 bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${uniqueId}_${safeBaseName}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

