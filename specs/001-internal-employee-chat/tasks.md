---
description: "Task list for Internal Employee Chat System implementation"
---

# Tasks: Internal Employee Chat System

**Input**: Design documents from `/specs/001-internal-employee-chat/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

## Format: `[TaskID] [P?] [Story] Description`
- **[P]**: Parallelizable (touches independent files with no unfinished prerequisites)
- **[Story]**: Associated user story tag (`[US1]`, `[US2]`, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monolithic repository layout, directory structure, and package dependencies.

- [X] T001 Initialize monolithic directory structure (`backend/src/{config,middleware,routes,services,sockets}`, `frontend/src/{components,context}`, `data/uploads`)
- [X] T002 Initialize `backend/package.json` with Express, Socket.io, Multer, and CORS dependencies
- [X] T003 [P] Initialize `frontend/package.json` with React, Vite, Tailwind CSS, `socket.io-client`, and `lucide-react`
- [X] T004 [P] Configure Tailwind CSS and PostCSS in `frontend/tailwind.config.js` and `frontend/src/index.css`
- [X] T005 [P] Configure Vite dev server proxy to backend port 3000 in `frontend/vite.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be completed before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Implement SQLite database connection with WAL mode and schema initialization for the 4 tables (`Users`, `MustRead`, `Messages`, `Groups`) and auto-seed initial admin `SuperB22`/`Super123` and 47 staff across Morning and Swing shifts in `backend/src/config/database.js`
- [X] T007 [P] Implement Multer local file upload middleware with strict 50MB limit (`limits: { fileSize: 52428800 }`) in `backend/src/middleware/upload.js`
- [X] T008 [P] Implement session authentication & single-session token verification middleware in `backend/src/middleware/auth.js`
- [X] T009 Implement monolithic Express HTTP server with static file serving and Socket.io attachment in `backend/src/server.js`
- [X] T010 [P] Setup frontend root application scaffold and theme structure in `frontend/src/App.jsx` and `frontend/src/main.jsx`

**Checkpoint**: Foundation ready - database auto-creates 4 tables with seeded admin and staff roster, and server runs on port 3000.

---

## Phase 3: User Story 1 - Employee Selection Authentication & Single Session Control (Priority: P1) 🎯 MVP

**Goal**: Enable employees to select their name from a roster, sign in with their password (EID strictly hidden on public login), and enforce single active session revocation upon duplicate login.

**Independent Test**: Select "Super Administrator", submit "Super123", verify successful login, then log in from a second browser and verify the first browser is immediately revoked with an alert. Confirm public roster API does not leak EID values.

### Implementation for User Story 1
- [X] T011 [US1] Implement user roster and authentication queries (`getPublicRoster` hiding EID, `getFullDirectory`, `authenticateUser`, `updateSessionToken`, `getUserById`) in `backend/src/services/userService.js`
- [X] T012 [US1] Implement authentication endpoints (`GET /api/auth/roster`, `POST /api/auth/login`, `GET /api/auth/me`) in `backend/src/routes/auth.js`
- [X] T013 [US1] Implement Socket.io authentication handshake and duplicate session revocation (`session_terminated` event) in `backend/src/sockets/chatSocket.js`
- [X] T014 [P] [US1] Implement AuthContext with token persistence, active user state, and session termination listener in `frontend/src/context/AuthContext.jsx`
- [X] T015 [P] [US1] Implement LoginModal component with searchable employee name dropdown (EID hidden) and password field in `frontend/src/components/LoginModal.jsx`
- [X] T016 [US1] Integrate authentication flow, login gate, and forced-logout toast notifications in `frontend/src/App.jsx`

**Checkpoint**: At this point, User Story 1 is fully functional as an independently testable MVP.

---

## Phase 4: User Story 2 - Real-Time Direct Messaging & Peer Group Chat with File Transfer (Priority: P2)

**Goal**: Provide real-time 1-on-1 private messaging and flat peer group collaboration with file attachments under 50MB (inline image previews with zoom and downloadable document cards).

**Independent Test**: Log in as two users, exchange direct messages and peer group messages, upload a 20MB image (verifying inline display with zoom), upload a PDF (verifying download card), and attempt to upload a 55MB file (verifying rejection).

### Implementation for User Story 2
- [X] T017 [US2] Implement messaging and group queries (`getDirectMessages`, `saveDirectMessage`, `getGroupMessages`, `saveGroupMessage`, `createGroup`, `getUserGroups`) in `backend/src/services/chatService.js`
- [X] T018 [US2] Implement chat REST endpoints (`GET /api/messages/direct/:userId`, `GET /api/groups`, `POST /api/groups`) in `backend/src/routes/messages.js` and `backend/src/routes/groups.js`
- [X] T019 [US2] Implement Multer file upload endpoint (`POST /api/upload`) returning file metadata and static download endpoint in `backend/src/routes/files.js`
- [X] T020 [US2] Implement Socket.io real-time events (`send_direct_message`, `send_group_message`, `new_direct_message`, `new_group_message`) and room joining in `backend/src/sockets/chatSocket.js`
- [X] T021 [P] [US2] Implement SocketContext managing Socket.io connection lifecycle and message event listeners in `frontend/src/context/SocketContext.jsx`
- [X] T022 [P] [US2] Implement DirectChat component with real-time stream, file picker (<50MB validation), inline image lightbox, and file cards in `frontend/src/components/DirectChat.jsx`
- [X] T023 [P] [US2] Implement GroupChat component with peer group creation modal, equal-rights member invitations, and chat stream in `frontend/src/components/GroupChat.jsx`

**Checkpoint**: At this point, User Stories 1 AND 2 are fully integrated and functional.

---

## Phase 5: User Story 3 - Persistent Global Navigation & Real-Time Notification Bell (Priority: P3)

**Goal**: Deliver a persistent top bar featuring a real-time notification bell (with unread badge and chime sound) across all views, and a left navigation sidebar with 5 distinct sections.

**Independent Test**: While browsing the Directory or Relax tab, receive a message from another employee; verify the top notification bell increments and chimes, and clicking the dropdown navigates to the conversation.

### Implementation for User Story 3
- [X] T024 [US3] Implement real-time notification dispatch logic on message arrival (filtering out active chat to avoid chime noise) in `backend/src/sockets/chatSocket.js`
- [X] T025 [P] [US3] Implement Header component with persistent notification bell, unread badge counter, Web Audio API chime sound, and notification dropdown in `frontend/src/components/Header.jsx`
- [X] T026 [P] [US3] Implement left Sidebar component with 5 navigation items (`EID Directory`, `MustRead`, `Direct Messages`, `Group Chat`, `Relax`) in `frontend/src/components/Sidebar.jsx`
- [X] T027 [P] [US3] Implement Directory view displaying active employees with status indicator and quick direct-message action in `frontend/src/components/Directory.jsx`
- [X] T028 [P] [US3] Implement Relax placeholder view with friendly "Coming Soon" card in `frontend/src/components/Relax.jsx`
- [X] T029 [US3] Connect navigation tabs and notification bell selection router in `frontend/src/App.jsx`

**Checkpoint**: Navigation across all tabs is unified with real-time alerts always visible.

---

## Phase 6: User Story 4 - MustRead Bulletin Board (Priority: P4)

**Goal**: Allow Administrators to create, edit, and delete company-wide announcements, and enable all employees to view them with real-time broadcast alerts.

**Independent Test**: Log in as Admin, post an announcement in MustRead, verify a real-time broadcast alert triggers on other employees' notification bells, and verify employees cannot edit or delete the notice.

### Implementation for User Story 4
- [X] T030 [US4] Implement MustRead queries (`getAllAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`) in `backend/src/services/mustreadService.js`
- [X] T031 [US4] Implement MustRead REST endpoints (`GET /api/mustread`, `POST /api/mustread`, `PUT /api/mustread/:id`, `DELETE /api/mustread/:id`) with Admin guard in `backend/src/routes/mustread.js`
- [X] T032 [US4] Broadcast `new_mustread_announcement` and notification bell alert to all connected sockets in `backend/src/sockets/chatSocket.js`
- [X] T033 [P] [US4] Implement MustRead view displaying chronological announcement feed, read receipts, and Admin editor modal in `frontend/src/components/MustRead.jsx`

**Checkpoint**: Company bulletin board is fully operational with admin controls.

---

## Phase 7: User Story 5 - Administrative Moderation & User Roster Management (Priority: P5)

**Goal**: Empower Administrators to provision and deactivate employee records, delete inappropriate messages in Group Chats, and delete entire group channels.

**Independent Test**: Log in as Admin, create a new employee `Bob` (`EMP102`), delete an inappropriate message in a group chat, delete a group, and verify Bob can log in while regular users have no moderation buttons.

### Implementation for User Story 5
- [X] T034 [US5] Implement admin user management and moderation queries (`createUser`, `deleteUser`, `deleteGroupMessage`, `deleteGroup`) in `backend/src/services/adminService.js`
- [X] T035 [US5] Implement admin endpoints (`POST /api/admin/users`, `DELETE /api/admin/users/:id`, `DELETE /api/admin/messages/:id`, `DELETE /api/admin/groups/:id`) in `backend/src/routes/admin.js`
- [X] T036 [US5] Broadcast `message_deleted` and `group_deleted` over Socket.io to remove purged content in real time in `backend/src/sockets/chatSocket.js`
- [X] T037 [P] [US5] Implement Admin management modal for creating/deleting employees and add group moderation delete buttons in `frontend/src/components/AdminPanel.jsx`

**Checkpoint**: Administrative governance, user provisioning, and group moderation are fully secured.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build integration, end-to-end verification, and monolithic single-command deployment.

- [X] T038 Configure monolithic build script in `backend/package.json` to compile frontend static bundle into `backend/public` for single-port serving
- [X] T039 [P] Add automated backend tests for auth, single session, 50MB file rejection, and 4-table CRUD in `backend/test/chat.test.js`
- [X] T040 Execute quickstart verification scenarios per `specs/001-internal-employee-chat/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Independent, starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion; blocks all user stories.
- **User Stories (Phase 3+)**: Sequential priority order (P1 → P2 → P3 → P4 → P5).
- **Polish (Phase 8)**: Depends on completion of desired user stories.

### Parallel Opportunities per Phase
- In Phase 1: T003, T004, T005 can be configured in parallel.
- In Phase 2: T007, T008, T010 can be developed in parallel after T006.
- In Phase 3: T014 and T015 can run in parallel while T011-T013 are built.
- In Phase 4: T021, T022, T023 can be styled and developed in parallel once T017-T020 provide contracts.
- In Phase 5: T025, T026, T027, T028 can be built in parallel.

---

## Implementation Strategy (MVP First)

1. **Step 1**: Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. **Step 2**: Implement Phase 3 (User Story 1 - Authentication & Single Session).
3. **Step 3 (MVP Checkpoint)**: Verify employee login and duplicate session termination.
4. **Step 4**: Implement Phase 4 (Direct & Group Messaging with 50MB file transfer).
5. **Step 5**: Implement Phase 5 (Top Notification Bell & Sidebar Navigation).
6. **Step 6**: Implement Phase 6 & 7 (MustRead announcements and Admin controls).
7. **Step 7**: Run Phase 8 verification and package monolithic distribution.

---

## Phase 9: Convergence

- [X] T041 Fetch authenticated full directory (`GET /api/users/directory`) in `frontend/src/context/AuthContext.jsx` when a valid session token is active so `eid` is populated for authenticated views (`Directory.jsx`, `DirectChat.jsx`, `GroupChat.jsx`, `AdminPanel.jsx`) while keeping `/api/auth/roster` EID-hidden on public login per FR-001, FR-011 (partial)
- [X] T042 Update `getUserGroups` in `backend/src/services/chatService.js`, `backend/src/routes/groups.js`, and `backend/src/sockets/chatSocket.js` so `Admin` users can view and join all peer group channels for moderation even if not explicitly invited at group creation per FR-007, US5/AC3 (partial)

