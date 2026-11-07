import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase } from './config/database.js';
import { UPLOADS_DIR, PUBLIC_DIR } from './config/paths.js';
import { setupChatSockets } from './sockets/chatSocket.js';

import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import groupRoutes from './routes/groups.js';
import fileRoutes from './routes/files.js';
import mustreadRoutes from './routes/mustread.js';
import adminRoutes from './routes/admin.js';

// 1. Initialize SQLite Database & seed data
initDatabase();

// 2. Setup Express
const app = express();
const server = http.createServer(app);

// 3. Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7 // 50MB
});

// Attach io instance to express app so routes can broadcast events
app.set('io', io);
setupChatSockets(io);

// 4. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', messageRoutes); // Alias for directory
app.use('/api/groups', groupRoutes);
app.use('/api', fileRoutes);
app.use('/api/mustread', mustreadRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend production build statically if public dir exists
app.use(express.static(PUBLIC_DIR));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile('index.html', { root: PUBLIC_DIR }, (err) => {
    if (err) {
      res.status(200).send('Internal FTU Chat Monolith API running. Build frontend with `npm run build` in frontend directory.');
    }
  });
});

const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'));
const PORT = process.env.PORT || 3000;
if (isMainModule) {
  server.listen(PORT, () => {
    console.log(`[FTU Chat Server] Monolith running at http://localhost:${PORT}`);
  });
}

export { app, server };
