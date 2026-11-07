# Quickstart: Internal Employee Chat System

## Prerequisites
- **Node.js**: v24.x or later installed
- **Operating System**: Windows / Linux / macOS on internal host server

---

## Project Structure
```text
internal-ftu/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (SQLite WAL mode) & paths
│   │   ├── middleware/      # Auth & single-session guard, Multer file upload
│   │   ├── routes/          # Express REST API (auth, users, messages, mustread)
│   │   ├── sockets/         # Socket.io connection handlers & event dispatch
│   │   ├── services/        # SQLite queries for 4 tables (Users, MustRead, Messages, Groups)
│   │   └── server.js        # Main monolithic server entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Header (Notification Bell), Sidebar, ChatView, Directory, MustRead
│   │   ├── context/         # Auth & Socket state context
│   │   ├── App.jsx
│   │   └── index.css        # Tailwind styles
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── data/
│   ├── chat.db              # SQLite database (4 tables, auto-created)
│   └── uploads/             # Local disk storage for file attachments (<50MB)
└── specs/
```

---

## Setup & Execution Steps

### 1. Install Dependencies
```bash
# Backend dependencies (Express, socket.io, multer, cors)
cd backend
npm install

# Frontend dependencies (React, Vite, Tailwind CSS, socket.io-client, lucide-react)
cd ../frontend
npm install
```

### 2. Development Mode
Run backend and frontend concurrently:
```bash
# Terminal 1 - Backend (port 3000)
cd backend
node src/server.js

# Terminal 2 - Frontend (port 5173 with proxy to 3000)
cd frontend
npm run dev
```

### 3. Production Monolithic Deployment
```bash
# Build frontend static bundle into backend/public
cd frontend
npm run build

# Start monolithic server
cd ../backend
node src/server.js
```
The server binds to port `3000` (or `PORT` environment variable), serving both API, WebSockets, and UI on `http://localhost:3000`.

---

## Verification & Test Scenarios

### Scenario 1: Initial Admin Login
1. Open `http://localhost:3000`.
2. Select **Super Administrator** from the employee dropdown.
3. Enter Password: `Super123`.
4. Verify immediate access to the dashboard.

### Scenario 2: Single-Session Revocation
1. Log in as `Super Administrator` in Browser Window 1.
2. Open an Incognito Window / Browser Window 2 and log in as `Super Administrator`.
3. Verify Window 1 receives the session termination alert and is redirected to login.

### Scenario 3: Real-Time Messaging & 50MB File Ceiling
1. Create a User `Alice` (`EMP101`) in Admin management.
2. Log in as `Alice` in Window 2.
3. Send a direct message and upload an image under 50MB; verify it displays inline with click-to-enlarge.
4. Attempt to upload a file over 50MB; verify immediate rejection with clear error.

### Scenario 4: Persistent Real-Time Bell Notification
1. Keep Alice on the `EID Directory` tab.
2. Send a message from Admin to Alice.
3. Verify the bell badge increments with a chime sound at the top of Alice's screen.

