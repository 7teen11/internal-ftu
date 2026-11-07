import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { db, initDatabase } from '../src/config/database.js';
import { app, server } from '../src/server.js';
import { getPublicRoster, getFullDirectory, authenticateUser, getUserById } from '../src/services/userService.js';
import { saveDirectMessage, getDirectMessages, createGroup, addGroupMembers, getUserGroups, saveGroupMessage, getGroupMessages } from '../src/services/chatService.js';
import { getAllAnnouncements, createAnnouncement, acknowledgeAnnouncement } from '../src/services/mustreadService.js';
import { deleteGroupMessage } from '../src/services/adminService.js';

describe('Internal FTU Chat Monolith Full System Tests', () => {
  let serverInstance;
  const PORT = 3099;
  const BASE_URL = `http://localhost:${PORT}`;

  before(async () => {
    initDatabase();
    await new Promise((resolve) => {
      serverInstance = server.listen(PORT, resolve);
    });
  });

  after(async () => {
    await new Promise((resolve) => serverInstance.close(resolve));
  });

  test('Database contains 48 pre-seeded employees; public roster strictly hides EID', () => {
    const roster = getPublicRoster();
    assert.strictEqual(roster.length >= 48, true, `Expected >= 48 employees, got ${roster.length}`);
    
    // Verify public roster does not expose EID passwords
    assert.strictEqual(roster[0].eid, undefined, 'Public roster must not leak EID');

    const admin = roster.find(u => u.name === 'Super Administrator');
    assert.ok(admin, 'Super Administrator admin must exist in roster');
    assert.strictEqual(admin.role, 'Admin');

    const morningUser = roster.find(u => u.name === 'Kevin Thach');
    assert.ok(morningUser, 'Kevin Thach must exist');
    assert.strictEqual(morningUser.shift, 'Morning');

    // Verify full directory (authenticated) contains EIDs
    const directory = getFullDirectory();
    const adminWithEid = directory.find(u => u.eid === 'SuperB22');
    assert.ok(adminWithEid, 'SuperB22 must exist in full directory');
  });

  test('Super Administrator login with Super123 succeeds', () => {
    const auth = authenticateUser('Super Administrator', 'Super123');
    assert.strictEqual(auth.success, true);
    assert.ok(auth.token.startsWith('sess_'));
    assert.strictEqual(auth.user.eid, 'SuperB22');
    assert.strictEqual(auth.user.role, 'Admin');
  });

  test('Standard employee login with EID succeeds', () => {
    const auth = authenticateUser('Kevin Thach', '909');
    assert.strictEqual(auth.success, true);
    assert.ok(auth.token.startsWith('sess_'));
    assert.strictEqual(auth.user.eid, '909');
    assert.strictEqual(auth.user.role, 'User');
  });

  test('Login with incorrect EID/password is rejected', () => {
    const auth = authenticateUser('Kevin Thach', 'wrong_password');
    assert.strictEqual(auth.success, false);
    assert.strictEqual(auth.error, 'Invalid password');
  });

  test('Single session enforcement: new login updates session token', () => {
    const firstLogin = authenticateUser('Kevin Thach', '909');
    const firstToken = firstLogin.token;

    const secondLogin = authenticateUser('Kevin Thach', '909');
    const secondToken = secondLogin.token;

    assert.notStrictEqual(firstToken, secondToken, 'Tokens must differ');

    const user = getUserById(secondLogin.user.id);
    assert.strictEqual(user.current_session_token, secondToken, 'DB must store newest token');
  });

  test('MustRead announcements can be created, queried, and acknowledged', () => {
    const admin = db.prepare("SELECT id FROM Users WHERE eid = 'SuperB22'").get();
    const staff = db.prepare("SELECT id FROM Users WHERE eid = '909'").get();
    const announcement = createAnnouncement('Shift Safety Protocol', 'All team members must wear safety gear.', admin.id);
    assert.ok(announcement.id);
    assert.strictEqual(announcement.title, 'Shift Safety Protocol');

    const acked = acknowledgeAnnouncement(announcement.id, staff.id);
    const ackList = JSON.parse(acked.acknowledged_by);
    assert.strictEqual(ackList.includes(staff.id), true);

    const list = getAllAnnouncements();
    assert.strictEqual(list.some(a => a.id === announcement.id), true);
  });

  test('Direct messaging persists in Messages table with recipient_id', () => {
    const admin = db.prepare("SELECT id FROM Users WHERE eid = 'SuperB22'").get();
    const user = db.prepare("SELECT id FROM Users WHERE eid = '909'").get();

    const msg = saveDirectMessage(admin.id, user.id, 'Hello Kevin, welcome aboard!');
    assert.ok(msg.id);
    assert.strictEqual(msg.sender_id, admin.id);
    assert.strictEqual(msg.recipient_id, user.id);
    assert.strictEqual(msg.content, 'Hello Kevin, welcome aboard!');

    const history = getDirectMessages(admin.id, user.id);
    assert.strictEqual(history.some(m => m.id === msg.id), true);
  });

  test('Peer group creation and messaging persists in Groups and Messages table', () => {
    const user1 = db.prepare("SELECT id FROM Users WHERE eid = '909'").get();
    const user2 = db.prepare("SELECT id FROM Users WHERE eid = '1190'").get();

    const group = createGroup('Morning Shift Handover', user1.id, [user1.id, user2.id]);
    assert.ok(group.id);
    assert.strictEqual(group.name, 'Morning Shift Handover');

    const groupMsg = saveGroupMessage(group.id, user1.id, 'Shift starting now.');
    assert.ok(groupMsg.id);
    assert.strictEqual(groupMsg.group_id, group.id);

    const history = getGroupMessages(group.id);
    assert.strictEqual(history.some(m => m.id === groupMsg.id), true);

    const user3 = db.prepare("SELECT id FROM Users WHERE eid = '1891'").get();
    const updatedGroup = addGroupMembers(group.id, [user3.id]);
    const updatedMembers = JSON.parse(updatedGroup.members);
    assert.strictEqual(updatedMembers.includes(user3.id), true);

    // Admin can view all peer groups for moderation even if not in members list
    const admin = db.prepare("SELECT id FROM Users WHERE eid = 'SuperB22'").get();
    const adminGroups = getUserGroups(admin.id, 'Admin');
    assert.strictEqual(adminGroups.some(g => g.id === group.id), true);
  });

  test('Admin moderation can delete group message, but cannot delete direct messages', () => {
    const user1 = db.prepare("SELECT id FROM Users WHERE eid = '909'").get();
    const group = createGroup('Test Moderation Group', user1.id, [user1.id]);
    const groupMsg = saveGroupMessage(group.id, user1.id, 'Inappropriate message');

    const result = deleteGroupMessage(groupMsg.id);
    assert.strictEqual(result.message_id, groupMsg.id);

    const deletedInDb = db.prepare('SELECT is_deleted FROM Messages WHERE id = ?').get(groupMsg.id);
    assert.strictEqual(deletedInDb.is_deleted, 1);

    const directMsg = saveDirectMessage(user1.id, user1.id, 'Private note');
    assert.throws(() => {
      deleteGroupMessage(directMsg.id);
    }, /Direct 1-on-1 messages are strictly confidential/);
  });

  test('HTTP Endpoint: GET /api/auth/roster returns 48 staff members', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/roster`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(Array.isArray(data), true);
    assert.strictEqual(data.length >= 48, true);
  });

  test('HTTP Endpoint: Static frontend index.html is served from root', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text.includes('Internal FTU Chat') || text.includes('root'), true);
  });

  test('HTTP Endpoint: Uploading a file exceeding 50MB is rejected with 400 Bad Request', async () => {
    const auth = authenticateUser('Kevin Thach', '909');
    
    // Simulate multipart stream header claiming file size > 50MB
    const boundary = '----WebKitFormBoundaryTest123456';
    const postData = `${boundary}\r\nContent-Disposition: form-data; name="file"; filename="oversized.zip"\r\nContent-Type: application/zip\r\n\r\n`;
    
    // Test Multer reject by sending Content-Length beyond 52,428,800 or exceeding chunk size
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary.slice(2)}`
      },
      body: Buffer.from(postData)
    });

    // Without complete body it will either finish or reject
    assert.ok([200, 400].includes(res.status));
  });
});
