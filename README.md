# FTU Internal Employee Chat System

A lightweight, real-time internal communication monolith engineered for up to 100 concurrent employees. Built with **Node.js v24 LTS (Express + Socket.io + native `node:sqlite`)** and **React 18 (Vite + Tailwind CSS)**.

---

## Key Features

- **Roster-Based Authentication & EID Privacy**: Employees select their name from the active roster and sign in using their assigned EID as their password. Public login endpoints strictly hide EID values; only authenticated employees can view the internal EID Directory.
- **Single Active Session Enforcement**: Signing in from a new browser or device immediately revokes and disconnects any prior session (`session_terminated` event).
- **1-on-1 Direct Messaging & Flat Peer Groups**:
  - Confidential 1-on-1 direct messages accessible strictly to the two participants.
  - Flat peer-to-peer group channels where any member can post and invite colleagues.
  - File & image sharing strictly under **50MB** (`52,428,800 bytes`): inline image previews with click-to-enlarge lightbox, and downloadable attachment cards for documents.
- **Persistent Global Notification Bell**: Fixed in the top header across all 5 workspace tabs (`EID Directory`, `MustRead`, `Messages`, `Group Chat`, `Relax`) with unread badges and Web Audio API chime alerts (automatically muted for the currently open conversation).
- **MustRead Bulletin Board**: Official company-wide notices managed by Admins with real-time broadcast alerts and employee read receipts (`Acknowledge Read`).
- **Role-Based Administration**: `Admin` users can provision/remove employee accounts, publish/edit/delete `MustRead` announcements, and moderate group messages/channels while 1-on-1 direct messages remain strictly private.

---

## Repository Structure

```text
internal-ftu/
├── backend/
│   ├── public/                  # Compiled React production bundle (served by Express)
│   ├── src/
│   │   ├── config/              # SQLite WAL + 64MB RAM cache setup & path constants
│   │   ├── middleware/          # Session token guard & Multer 50MB upload limit
│   │   ├── routes/              # REST APIs (auth, messages, groups, mustread, files, admin)
│   │   ├── services/            # 4-table SQLite data access layer
│   │   ├── sockets/             # Socket.io real-time events & single-session enforcement
│   │   └── server.js            # Monolithic HTTP + WebSocket entrypoint
│   └── test/                    # Automated integration test suite (node:test)
├── frontend/
│   └── src/                     # React + Tailwind CSS client source
├── deploy/                      # Windows 11 Pro production deployment configs & scripts
│   ├── install-service.ps1      # Automated NSSM Windows Service installer & OS tuning
│   ├── backup-chat.ps1          # Zero-downtime SQLite WAL hot backup (VACUUM INTO) + robocopy
│   ├── update-app.ps1           # Safe production update workflow
│   ├── apache-ftu-vhosts.conf   # Apache 2.4 Reverse Proxy + Web + iPXE HTTP QoS config
│   ├── boot.ipxe                # iPXE Gigabit HTTP network boot menu
│   └── Caddyfile                # Optional Caddy port 80 reverse proxy config
└── data/
    ├── chat.db                  # Auto-created SQLite database (untracked in Git)
    └── uploads/                 # Local disk attachment storage (< 50MB)
```

---

## Quickstart (Local & Production)

### Prerequisites
- **Node.js**: `v24.x LTS` (required for built-in `node:sqlite`)
- **Git**

### 1. Install & Build
```powershell
git clone https://github.com/7teen11/internal-ftu.git
cd internal-ftu
npm run install:all
npm run build
```

### 2. Run Server
```powershell
npm start
```
Open **`http://localhost:3000`**:
- **Initial Admin**: Select `Super Administrator` — Password: `Super123`
- **Staff Roster**: 47 pre-seeded `Morning` and `Swing` shift employees (Password = assigned `EID`).

---

## Windows 11 Pro Server Deployment (i5 / 16GB DDR3 Optimized)

The `deploy/` directory provides configurations for running this monolith on a **Windows 11 Pro** server alongside **Apache 2.4 Web Server**, **iPXE HTTP Network Boot**, and **Internal File Storage**:

1. **Install as a Native Windows Service (`NSSM`)**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy\install-service.ps1 -Port 3000
   ```
2. **Schedule Daily Hot Backup (03:00 AM via Task Scheduler)**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy\backup-chat.ps1 -BackupRoot "E:\Backups\ftu-chat" -RegisterDailyTask
   ```
3. **Update Application Safely**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy\update-app.ps1
   ```
