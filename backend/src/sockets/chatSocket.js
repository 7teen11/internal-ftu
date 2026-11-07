import { getUserByToken } from '../services/userService.js';
import { saveDirectMessage, saveGroupMessage, getUserGroups } from '../services/chatService.js';

// Map of userId -> socket.id for active single-session management
const activeUserSockets = new Map();

export function setupChatSockets(io) {
  // Middleware for Socket.io authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const user = getUserByToken(token);
    if (!user) {
      return next(new Error('Invalid or expired session'));
    }

    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user.id;

    // Single active session enforcement:
    // If user already has an active socket, terminate the older one
    if (activeUserSockets.has(userId)) {
      const oldSocketId = activeUserSockets.get(userId);
      if (oldSocketId !== socket.id) {
        io.to(oldSocketId).emit('session_terminated', {
          reason: 'Your account was logged in from another device or browser window.'
        });
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }
    }

    // Register active socket for this user
    activeUserSockets.set(userId, socket.id);

    // Join personal room for 1-on-1 messaging & targeted alerts
    socket.join(`user_${userId}`);

    // Join all groups this user belongs to (Admins join all groups for moderation)
    try {
      const userGroups = getUserGroups(userId, user.role);
      userGroups.forEach((g) => {
        socket.join(`group_${g.id}`);
      });
    } catch (e) {
      console.error('Error joining user groups:', e);
    }

    // Broadcast updated online roster IDs
    io.emit('online_users', Array.from(activeUserSockets.keys()));

    // 1. Direct Message event
    socket.on('send_direct_message', (payload, callback) => {
      try {
        const { recipient_id, content, file_path, file_name, file_size, file_mime } = payload;
        if (!recipient_id) return;

        const savedMsg = saveDirectMessage(userId, recipient_id, content, {
          path: file_path,
          name: file_name,
          size: file_size,
          mime: file_mime
        });

        // Dispatch to recipient and sender personal rooms
        io.to(`user_${recipient_id}`).emit('new_direct_message', savedMsg);
        io.to(`user_${userId}`).emit('new_direct_message', savedMsg);

        // Send notification bell alert to recipient
        io.to(`user_${recipient_id}`).emit('notification_bell_alert', {
          type: 'DirectMessage',
          title: `New Message from ${user.name}`,
          body: content || (file_name ? `Sent an attachment: ${file_name}` : 'New message'),
          reference_id: userId,
          play_sound: true
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: savedMsg });
        }
      } catch (err) {
        console.error('send_direct_message error:', err);
        if (typeof callback === 'function') {
          callback({ error: err.message });
        }
      }
    });

    // 2. Group Message event
    socket.on('send_group_message', (payload, callback) => {
      try {
        const { group_id, content, file_path, file_name, file_size, file_mime } = payload;
        if (!group_id) return;

        const savedMsg = saveGroupMessage(group_id, userId, content, {
          path: file_path,
          name: file_name,
          size: file_size,
          mime: file_mime
        });

        // Broadcast to entire group
        io.to(`group_${group_id}`).emit('new_group_message', savedMsg);

        // Send notification bell alert to group members except sender
        socket.to(`group_${group_id}`).emit('notification_bell_alert', {
          type: 'GroupMessage',
          title: `Group Message from ${user.name}`,
          body: content || (file_name ? `Shared a file: ${file_name}` : 'New group message'),
          reference_id: group_id,
          play_sound: true
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: savedMsg });
        }
      } catch (err) {
        console.error('send_group_message error:', err);
        if (typeof callback === 'function') {
          callback({ error: err.message });
        }
      }
    });

    // Join newly created group
    socket.on('join_group_room', ({ group_id }) => {
      if (group_id) {
        socket.join(`group_${group_id}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (activeUserSockets.get(userId) === socket.id) {
        activeUserSockets.delete(userId);
      }
      io.emit('online_users', Array.from(activeUserSockets.keys()));
    });
  });
}

