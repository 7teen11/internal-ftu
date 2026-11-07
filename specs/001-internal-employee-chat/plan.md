# Implementation Plan: Internal Employee Chat System

**Branch**: `001-internal-employee-chat` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-internal-employee-chat/spec.md`

## Summary
Build an on-premise, real-time internal employee communication monolith for up to 100 concurrent users. The stack utilizes React (Vite) + Tailwind CSS for the client, Node.js (Express) + Socket.io for the API and real-time event pipeline, SQLite with 4 tables (`Users`, `MustRead`, `Messages`, `Groups`) for persistence, and local disk storage via Multer for file attachments strictly under 50MB. Bootstrap admin credentials are seeded as `SuperB22` / `Super123`.

## Technical Context

**Language/Version**: JavaScript / Node.js v24 LTS (backend) and React 18+ (frontend)

**Primary Dependencies**:
- Backend: Express, Socket.io, Multer, `node:sqlite` (Node 24 built-in synchronous SQLite bindings)
- Frontend: React, Vite, Tailwind CSS, socket.io-client, lucide-react

**Storage**: Local SQLite database at `data/chat.db` (WAL mode enabled, 4 tables) + Local filesystem folder `data/uploads/` for file attachments under 50MB

**Testing**: Built-in `node:test` and `node:assert` for backend API and integration tests; component manual validation via Vite quickstart

**Target Platform**: Self-hosted on-premise internal server (Windows / Linux) accessed via desktop web browsers over the corporate intranet

**Project Type**: Monolithic Web Application (Express serves REST API, WebSocket streams, and compiled React static assets from a single service)

**Performance Goals**:
- Real-time message and notification delivery latency < 500ms on internal network
- Initial login and dashboard transition < 3 seconds
- Server memory footprint < 150MB under 100 concurrent connections

**Constraints**:
- Single active session per user (concurrent login forcibly terminates earlier session)
- Maximum file attachment size strictly under 50MB (52,428,800 bytes)
- Admin moderation scoped to Group Chats; 1-on-1 direct messages strictly confidential to participants
- Strictly 4 relational tables in SQLite (`Users`, `MustRead`, `Messages`, `Groups`)

**Scale/Scope**: Up to 100 concurrent internal employees

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Compliance Status |
|:---|:---|:---:|
| **I. Lightweight & Real-Time Responsiveness** | Socket.io duplex connection + Node.js event-driven architecture delivers sub-second message delivery under 100 users. | **PASS** |
| **II. Simple Monolithic Architecture** | Single deployable service containing both backend endpoints, Socket.io server, and static React build output. No distributed services or message queues. | **PASS** |
| **III. Local-First Storage & Effortless Backup** | All persistent data stored in local `data/chat.db` SQLite database and `data/uploads/` folder. Entire system can be backed up via simple directory copy. | **PASS** |
| **IV. Minimal Third-Party Dependencies** | Native `node:sqlite` avoids C++ compilation overhead; industry-standard minimal packages (Express, Socket.io, Multer, Vite, Tailwind) selected directly for productivity. | **PASS** |
| **V. Pragmatic Minimalism & English-First Standard** | Utilitarian UI, clean 4-table schema, English used across code, UI, API payloads, and documentation. | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/001-internal-employee-chat/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── auth-api.md
│   ├── chat-api.md
│   └── socket-events.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
internal-ftu/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # SQLite setup, WAL mode, 4-table migrations, SuperB22 seed
│   │   │   └── paths.js        # Data and upload directory references
│   │   ├── middleware/
│   │   │   ├── auth.js         # Token verification & single session check
│   │   │   └── upload.js       # Multer configuration with 50MB ceiling
│   │   ├── routes/
│   │   │   ├── auth.js         # Login, roster, me, admin user management
│   │   │   ├── messages.js     # Direct and group message history
│   │   │   ├── groups.js       # Peer group creation, member listing, admin deletion
│   │   │   ├── mustread.js     # Admin bulletin board CRUD
│   │   │   └── files.js        # File upload and static attachment downloads
│   │   ├── sockets/
│   │   │   └── chatSocket.js   # Socket.io connection, room routing, notification bell
│   │   ├── services/
│   │   │   └── chatService.js  # SQLite query helpers for Users, Messages, Groups, MustRead
│   │   └── server.js           # Monolithic entrypoint (Express + Socket.io + static files)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx      # Persistent top bar with real-time Notification Bell
│   │   │   ├── Sidebar.jsx     # Navigation: Directory, MustRead, Message, Group, Relax
│   │   │   ├── DirectChat.jsx  # 1-on-1 messaging view with inline images & file cards
│   │   │   ├── GroupChat.jsx   # Peer group messaging view with admin moderation
│   │   │   ├── Directory.jsx   # EID Directory view
│   │   │   ├── MustRead.jsx    # Bulletin board feed and admin announcement editor
│   │   │   ├── Relax.jsx       # Coming soon placeholder
│   │   │   └── LoginModal.jsx  # Name selection + EID password form
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Current user state & single-session listener
│   │   │   └── SocketContext.jsx # Socket.io connection provider & event bus
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind base styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── data/
    ├── chat.db                 # SQLite database (auto-initialized)
    └── uploads/                # Local attachment storage
```

**Structure Decision**: Monolithic web application organized into `backend/` and `frontend/` source directories. In production, `frontend/` builds into static assets served directly by `backend/src/server.js`, resulting in a single node process running the entire system.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|:---|:---|:---|
| React + Vite frontend | Rich real-time UI state (inline zoom, live bell badges, active chat scrolling, modal dialogs) requires structured component state. | Vanilla DOM script would become brittle when managing dynamic notification bell states and multi-room Socket.io feeds. |
| Socket.io library | Reliable room routing, automatic reconnection, and targeted user socket emission out-of-the-box. | Raw WebSockets require custom heartbeat, room multiplexing, and reconnection logic that would duplicate Socket.io code. |
| Multer library | Standard streaming parser for `multipart/form-data` supporting the 50MB boundary check. | Manual Node stream chunk parsing for multipart boundaries is complex and error-prone. |
