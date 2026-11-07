# Technical Research: Internal Employee Chat System

## Overview
This document records the architectural and technology decisions aligned with the user specifications and project constitution:
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js (Express) + Socket.io for real-time events
- **Database**: SQLite with exactly 4 tables (`Users`, `MustRead`, `Messages`, `Groups`)
- **File Storage**: Local filesystem via Multer (under 50MB ceiling)
- **Bootstrap Admin**: Hardcoded initial admin credentials `SuperB22` / `Super123`

---

## Decision 1: Frontend Architecture (React + Vite + Tailwind CSS)

### Decision
Use **React 18/19** bootstrapped with **Vite** and styled using **Tailwind CSS**. The build output (`dist/`) is served statically by the Express monolith in production, with Vite dev server enabled during development.

### Rationale
- **Component Ergonomics**: Real-time chat applications require dynamic UI state management (live message feeds, active typing indicators, unread badge counters, modal overlays for image viewing). React provides declarative component states for these interactions.
- **Tailwind Utility Styling**: Enables rapid development of clean, responsive UI layouts with zero custom CSS clutter and minimal stylesheet size via Purge/JIT compilation.
- **Monolithic Static Serving**: Running `npm run build` generates optimized static assets directly into the Express public directory, maintaining single-service monolithic deployment.

---

## Decision 2: Backend & Real-Time Engine (Express + Socket.io)

### Decision
Use **Express** as the HTTP API framework combined with **Socket.io** attached to the same HTTP server instance.

### Rationale
- **Unified Monolith**: A single Node.js process handles REST endpoints (auth, file uploads, static asset serving) and WebSocket duplex streams.
- **Real-Time Reliability**: Socket.io provides automatic reconnection, room management (`socket.join('group_' + groupId)`), and user-targeted dispatch (`io.to(userSocketId).emit(...)`), simplifying group chat broadcasts and notification bell updates.
- **Single-Session Enforcement**: On user login, the server registers the active socket ID. If another connection authenticates with the same user ID, the server dispatches a `session_terminated` event to the earlier socket and disconnects it.

---

## Decision 3: 4-Table SQLite Persistence

### Decision
Store all application data in a local SQLite database (`data/chat.db`) structured across exactly **4 tables**:
1. `Users`: Employee identities, EIDs, roles (`Admin` or `User`), and account status.
2. `MustRead`: Official announcements authored by Admins.
3. `Messages`: Unified messaging store accommodating both 1-on-1 direct messages (`recipient_id` populated, `group_id` NULL) and group messages (`group_id` populated, `recipient_id` NULL), along with attachment metadata and soft-deletion flags.
4. `Groups`: Group metadata and membership (stored as JSON array in `members` column: `[userId1, userId2, ...]`), eliminating the need for a separate join table while keeping queries simple.

### Rationale
- Strictly adheres to the requirement for a clean 4-table relational layout.
- WAL mode (`PRAGMA journal_mode = WAL`) guarantees high concurrency for 100 internal users.
- Entire database is contained in `data/chat.db` for instant file-based backups.

---

## Decision 4: File Upload & Storage (Multer on Local Disk)

### Decision
Use **Multer** storage engine configured to write directly to `data/uploads/` with a strict `limits: { fileSize: 50 * 1024 * 1024 }` (50MB) configuration.

### Rationale
- Multer handles multipart file streaming directly to disk with minimal memory overhead.
- Immediate boundary enforcement returns HTTP 400 with `File size exceeds 50MB limit` before files are persisted.
- Storing uploads in `data/uploads/` alongside `data/chat.db` enables complete system backup by archiving the single `data/` folder.

---

## Decision 5: Administrative Credential Seeding

### Decision
Hardcode initial administrator bootstrapping in the database initialization sequence:
- **EID / Username**: `SuperB22`
- **Password**: `Super123`
- **Name**: `Super Administrator`
- **Role**: `Admin`

### Rationale
- Ensures the system is immediately usable upon first launch without manual SQL setup.
- If the `SuperB22` record does not exist in `Users`, the startup migration script inserts it automatically.
