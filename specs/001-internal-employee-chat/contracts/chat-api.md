# Contract: Chat, MustRead & File Upload API

## Endpoints

### 1. `GET /api/users/directory`
Returns the full EID Directory of employees.

**Request**:
- Header: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "eid": "SuperB22",
    "name": "Super Administrator",
    "role": "Admin",
    "is_online": true
  },
  {
    "id": 2,
    "eid": "EMP101",
    "name": "Alice Smith",
    "role": "User",
    "is_online": false
  }
]
```

---

### 2. `GET /api/messages/direct/:otherUserId`
Retrieves message history between the current user and another employee.

**Request**:
- Header: `Authorization: Bearer <token>`
- Query: `?limit=50&before=120`

**Response (200 OK)**:
```json
[
  {
    "id": 101,
    "sender_id": 2,
    "recipient_id": 1,
    "content": "Hello Admin, please check this report.",
    "file_path": "/uploads/17234912_report.pdf",
    "file_name": "report.pdf",
    "file_size": 2450120,
    "file_mime": "application/pdf",
    "is_read": 1,
    "created_at": "2026-11-07 13:45:00"
  }
]
```

---

### 3. `GET /api/groups`
Returns list of peer groups the current user belongs to.

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Engineering Team",
    "created_by": 1,
    "members": [1, 2, 3],
    "created_at": "2026-11-07 10:00:00"
  }
]
```

---

### 4. `POST /api/groups`
Creates a new peer group.

**Request**:
```json
{
  "name": "Project Alpha",
  "members": [2, 3]
}
```

**Response (201 Created)**:
```json
{
  "id": 2,
  "name": "Project Alpha",
  "created_by": 1,
  "members": [1, 2, 3],
  "created_at": "2026-11-07 14:10:00"
}
```

---

### 5. `DELETE /api/admin/groups/:id` (Admin Only)
Deletes a group channel and its messages.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Group removed"
}
```

---

### 6. `DELETE /api/admin/messages/:id` (Admin Only)
Moderates (deletes) a message in a Group Chat. Direct messages return 403 Forbidden.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Message removed"
}
```

---

### 7. `GET /api/mustread` & `POST /api/mustread`
Fetches all MustRead announcements or creates a new one (Admin only).

**POST Request (Admin Only)**:
```json
{
  "title": "Quarterly All-Hands Meeting",
  "content": "Meeting scheduled for next Monday at 9:00 AM."
}
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "title": "Quarterly All-Hands Meeting",
  "content": "Meeting scheduled for next Monday at 9:00 AM.",
  "author_id": 1,
  "author_name": "Super Administrator",
  "created_at": "2026-11-07 14:15:00"
}
```

---

### 8. `POST /api/upload`
Uploads a file using Multer to local storage `data/uploads/`. Strict 50MB ceiling enforced.

**Request**:
- Content-Type: `multipart/form-data`
- Field name: `file`

**Response (200 OK)**:
```json
{
  "file_path": "/uploads/17234912_design_spec.png",
  "file_name": "design_spec.png",
  "file_size": 4512030,
  "file_mime": "image/png"
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "File exceeds 50MB limit"
}
```

