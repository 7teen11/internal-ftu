import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { DB_PATH, DATA_DIR, UPLOADS_DIR } from './paths.js';

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign key constraints
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Table Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eid TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      shift TEXT NOT NULL DEFAULT 'Morning',
      role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
      is_active INTEGER NOT NULL DEFAULT 1,
      current_session_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_eid ON Users(eid);
    CREATE INDEX IF NOT EXISTS idx_users_name ON Users(name);
  `);

  // 2. Table MustRead
  db.exec(`
    CREATE TABLE IF NOT EXISTS MustRead (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      acknowledged_by TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mustread_created ON MustRead(created_at DESC);
  `);

  // Ensure acknowledged_by column exists on existing MustRead tables
  try {
    db.exec(`ALTER TABLE MustRead ADD COLUMN acknowledged_by TEXT NOT NULL DEFAULT '[]';`);
  } catch {
    // Column already exists
  }

  // 3. Table Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS Messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES Groups(id) ON DELETE CASCADE,
      content TEXT,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      file_mime TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_messages_direct ON Messages(sender_id, recipient_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_group ON Messages(group_id, created_at);
  `);

  // 4. Table Groups
  db.exec(`
    CREATE TABLE IF NOT EXISTS Groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER REFERENCES Users(id) ON DELETE SET NULL,
      members TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_groups_created ON Groups(created_at DESC);
  `);

  seedInitialData();
}

const DEFAULT_EMPLOYEES = [
  // Super Admin
  { eid: 'SuperB22', name: 'Super Administrator', shift: 'Admin', role: 'Admin' },

  // Morning Shift
  { eid: '909', name: 'Kevin Thach', shift: 'Morning', role: 'User' },
  { eid: '1190', name: 'Quang Dieu Dang', shift: 'Morning', role: 'User' },
  { eid: '1891', name: 'Terrance Tsai', shift: 'Morning', role: 'User' },
  { eid: '5538', name: 'Zarni Htoon', shift: 'Morning', role: 'User' },
  { eid: '5834', name: 'Chihung Nguyen', shift: 'Morning', role: 'User' },
  { eid: '6312', name: 'Lusheng (Louise) Yang', shift: 'Morning', role: 'User' },
  { eid: '6498', name: 'U (Toh) Set', shift: 'Morning', role: 'User' },
  { eid: '6873', name: 'Jake Herrera', shift: 'Morning', role: 'User' },
  { eid: '7687', name: 'Aixiong (Alan) Zong', shift: 'Morning', role: 'User' },
  { eid: '8778', name: 'Htoo Paing', shift: 'Morning', role: 'User' },
  { eid: '8841', name: 'Aung Myint Thein', shift: 'Morning', role: 'User' },
  { eid: 'TA1093', name: 'Nyan Moe Yan Lin', shift: 'Morning', role: 'User' },
  { eid: 'TA1507', name: 'Htoo Myat', shift: 'Morning', role: 'User' },
  { eid: 'TA1625', name: 'Min Ko Ko Oo', shift: 'Morning', role: 'User' },
  { eid: 'TA1704', name: 'Naw San', shift: 'Morning', role: 'User' },
  { eid: 'TA1819', name: 'Moe Hein Naing', shift: 'Morning', role: 'User' },
  { eid: 'TA1912', name: 'Hein Ko', shift: 'Morning', role: 'User' },
  { eid: 'TA1913', name: 'June Aung Tun', shift: 'Morning', role: 'User' },
  { eid: 'TA1946', name: 'Allen Myles', shift: 'Morning', role: 'User' },
  { eid: 'TA1987', name: 'Kvar Bo Vic', shift: 'Morning', role: 'User' },
  { eid: 'TA2017', name: 'Tharr Taw Aung', shift: 'Morning', role: 'User' },
  { eid: 'TA2018', name: 'Aung Phone Kyaw', shift: 'Morning', role: 'User' },
  { eid: 'TA2022', name: 'Himanshu Joshi', shift: 'Morning', role: 'User' },
  { eid: 'TA2054', name: 'Htet Thiri Aung', shift: 'Morning', role: 'User' },
  { eid: 'TA2133', name: 'Khin Khin Nyein', shift: 'Morning', role: 'User' },
  { eid: 'TA2294', name: 'Kaung Zaw Sai', shift: 'Morning', role: 'User' },
  { eid: 'TA2302', name: 'Phyo Thet Khine', shift: 'Morning', role: 'User' },
  { eid: 'TA2304', name: 'Han Sit Paing', shift: 'Morning', role: 'User' },
  { eid: 'TA2311', name: 'Ye Yint Nay Htun', shift: 'Morning', role: 'User' },
  { eid: 'TA2348', name: 'Hao Jyun Bai', shift: 'Morning', role: 'User' },
  { eid: 'TA2376', name: 'Lwin Moe', shift: 'Morning', role: 'User' },

  // Swing Shift
  { eid: '4043', name: 'Lucas Huang', shift: 'Swing', role: 'User' },
  { eid: '4359', name: 'Michael Wen', shift: 'Swing', role: 'User' },
  { eid: '4821', name: 'Aung Kyaw Htun', shift: 'Swing', role: 'User' },
  { eid: '8784', name: 'Yuqi Zhu', shift: 'Swing', role: 'User' },
  { eid: 'TA1094', name: 'Ye Zarny Lin', shift: 'Swing', role: 'User' },
  { eid: 'TA1104', name: 'Amirouche Madaoui', shift: 'Swing', role: 'User' },
  { eid: 'TA1276', name: 'Sai Aung Ko Ko', shift: 'Swing', role: 'User' },
  { eid: 'TA1419', name: 'Swan Htet Aung', shift: 'Swing', role: 'User' },
  { eid: 'TA1541', name: 'Kaung Wai Win', shift: 'Swing', role: 'User' },
  { eid: 'TA1566', name: 'Thet Paing Hein', shift: 'Swing', role: 'User' },
  { eid: 'TA1616', name: 'Sai Myat Thu (Rehire)', shift: 'Swing', role: 'User' },
  { eid: 'TA1703', name: 'Nyi Lynn Aung', shift: 'Swing', role: 'User' },
  { eid: 'TA1775', name: 'Nyi Nyi Lin', shift: 'Swing', role: 'User' },
  { eid: 'TA1963', name: 'Phyo ko', shift: 'Swing', role: 'User' },
  { eid: 'TA2016', name: 'Htet Aung Shine', shift: 'Swing', role: 'User' },
  { eid: 'TA2023', name: 'Thurain Zaw', shift: 'Swing', role: 'User' }
];

function seedInitialData() {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO Users (eid, name, shift, role, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const emp of DEFAULT_EMPLOYEES) {
    insertUser.run(emp.eid, emp.name, emp.shift, emp.role);
  }

  // Seed sample MustRead announcement if none exists
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM MustRead');
  const result = countStmt.get();
  if (result.count === 0) {
    const adminUser = db.prepare('SELECT id FROM Users WHERE eid = ?').get('SuperB22');
    if (adminUser) {
      db.prepare(`
        INSERT INTO MustRead (title, content, author_id)
        VALUES (?, ?, ?)
      `).run(
        'Welcome to Internal FTU Chat',
        'Welcome all Morning and Swing shift team members to our internal chat system. Real-time messaging, group collaboration, and file sharing up to 50MB are now live.',
        adminUser.id
      );
    }
  }
}

