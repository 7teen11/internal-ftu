# Contract: Authentication & User API

## Endpoints

### 1. `GET /api/auth/roster`
Returns the public list of active employee names for the dropdown login selector.

**Request**:
- Method: `GET`
- Auth: None

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Super Administrator",
    "role": "Admin"
  },
  {
    "id": 2,
    "name": "John Doe",
    "role": "User"
  }
]
```

---

### 2. `POST /api/auth/login`
Authenticates an employee using name and EID password. Enforces single active session: older sessions are invalidated and notified via Socket.io.

**Request**:
- Method: `POST`
- Content-Type: `application/json`

```json
{
  "name": "Super Administrator",
  "password": "Super123"
}
```
*(For regular users, password matches their assigned EID)*

**Response (200 OK)**:
```json
{
  "token": "sess_89f023acde784",
  "user": {
    "id": 1,
    "eid": "SuperB22",
    "name": "Super Administrator",
    "role": "Admin"
  }
}
```

**Errors**:
- `401 Unauthorized`: `{"error": "Invalid credentials"}`
- `403 Forbidden`: `{"error": "Account is deactivated"}`

---

### 3. `GET /api/auth/me`
Fetches the current authenticated employee profile using the Bearer token or cookie.

**Request**:
- Header: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "id": 1,
  "eid": "SuperB22",
  "name": "Super Administrator",
  "role": "Admin"
}
```

---

### 4. `POST /api/admin/users` (Admin Only)
Creates a new employee record in the `Users` table.

**Request**:
- Header: `Authorization: Bearer <token>`
- Body:
```json
{
  "name": "Alice Smith",
  "eid": "EMP101",
  "role": "User"
}
```

**Response (201 Created)**:
```json
{
  "id": 3,
  "name": "Alice Smith",
  "eid": "EMP101",
  "role": "User",
  "created_at": "2026-11-07 14:00:00"
}
```

---

### 5. `DELETE /api/admin/users/:id` (Admin Only)
Deactivates or deletes an employee record.

**Request**:
- Header: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

