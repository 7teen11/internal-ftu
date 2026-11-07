# Contract: Socket.io Real-Time Event Protocol

## Connection Handshake
- Client connects to `/` with query or auth payload:
  ```javascript
  const socket = io({
    auth: { token: 'sess_token_string' }
  });
  ```
- Server authenticates the token, registers the user's active socket, and joins the user's personal room `user_<id>` and all member group rooms `group_<id>`.
- If an existing socket is registered for this user ID:
  ```javascript
  io.to(previousSocketId).emit('session_terminated', {
    reason: 'Logged in from another location'
  });
  ```

---

## Client-to-Server Events

### 1. `send_direct_message`
```json
{
  "recipient_id": 2,
  "content": "Hey Alice, check the latest deployment.",
  "file_path": "/uploads/17234912_design_spec.png",
  "file_name": "design_spec.png",
  "file_size": 4512030,
  "file_mime": "image/png"
}
```

### 2. `send_group_message`
```json
{
  "group_id": 1,
  "content": "Welcome to the new channel everyone!",
  "file_path": null,
  "file_name": null,
  "file_size": null,
  "file_mime": null
}
```

### 3. `mark_read`
```json
{
  "conversation_type": "direct",
  "target_id": 2
}
```

---

## Server-to-Client Events

### 1. `new_direct_message`
Emitted to sender and recipient personal rooms.
```json
{
  "id": 105,
  "sender_id": 1,
  "recipient_id": 2,
  "content": "Hey Alice, check the latest deployment.",
  "file_path": "/uploads/17234912_design_spec.png",
  "file_name": "design_spec.png",
  "file_size": 4512030,
  "file_mime": "image/png",
  "created_at": "2026-11-07 14:20:00"
}
```

### 2. `new_group_message`
Broadcast to `group_<groupId>`.
```json
{
  "id": 204,
  "group_id": 1,
  "sender_id": 1,
  "sender_name": "Super Administrator",
  "content": "Welcome to the new channel everyone!",
  "file_path": null,
  "created_at": "2026-11-07 14:21:00"
}
```

### 3. `notification_bell_alert`
Emitted to target recipient(s) when a message or announcement arrives outside their currently active view.
```json
{
  "type": "DirectMessage", // or "GroupMessage", "MustRead"
  "title": "New message from Super Administrator",
  "body": "Hey Alice, check the latest deployment.",
  "reference_id": 1,
  "play_sound": true
}
```

### 4. `new_mustread_announcement`
Broadcast to all connected clients.
```json
{
  "id": 1,
  "title": "Quarterly All-Hands Meeting",
  "content": "Meeting scheduled for next Monday at 9:00 AM.",
  "author_name": "Super Administrator",
  "created_at": "2026-11-07 14:15:00"
}
```

### 5. `message_deleted` (Admin Moderation)
Broadcast to `group_<groupId>` when an Admin purges a message.
```json
{
  "message_id": 204,
  "group_id": 1
}
```

### 6. `group_deleted` (Admin Moderation)
Broadcast to `group_<groupId>` when an Admin purges a group.
```json
{
  "group_id": 1
}
```

### 7. `session_terminated`
Emitted to a client when their session is superseded by a newer login.
```json
{
  "reason": "Logged in from another location"
}
```

