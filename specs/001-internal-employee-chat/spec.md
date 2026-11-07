# Feature Specification: Internal Employee Chat System

**Feature Branch**: `001-internal-employee-chat`

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "Xây dựng ứng dụng chat nội bộ cho danh sách nhân viên. Người dùng đăng nhập bằng cách chọn tên và nhập mật khẩu là EID (danh sach login duoc tao san boi admin, không tính năng đổi mật khẩu). Hệ thống có 2 vai trò: Admin (tạo/xoa/sua MustRead, xóa tin nhắn/nhóm, tao,xoa thong tin user) và User. chong trung lap user login. Giao diện bao gồm chuông thông báo realtime luôn hiển thị ở trên cùng cao nhat bat ke o tab nao và thanh điều hướng bên trái với các mục: danh bạ EID, bảng tin MustRead, chat cá nhân (Message), chat nhóm (Group ngang hàng) và Relax(mo rong sau). Hỗ trợ truyền file dưới 50MB."

## Clarifications

### Session 2026-11-07
- Q: How should the system handle duplicate logins when an employee signs in while an existing active session is running? → A: Option A - Automatically terminate (force-logout) the older session and grant immediate access to the new login with an informative notification alert on the disconnected device.
- Q: Can Administrators browse and delete private 1-on-1 direct messages between employees, or does message deletion authority apply only to group chats? → A: Option A - Admins can moderate and delete any messages and channels in Group Chats only; private 1-on-1 messages remain strictly private to the two participants.
- Q: How should image files be displayed in chat conversations compared to other non-image file attachments? → A: Option A - Render image files (PNG, JPG, GIF, WebP) directly inline with click-to-enlarge; display all other files as downloadable attachment cards showing filename, size, and download button.
- Q: Which events should increment the real-time notification bell, and should notifications include an audio alert? → A: Option A - Increment the bell badge and play a subtle chime for new Direct Messages, messages in inactive Group chats, and MustRead posts; messages in the currently open conversation do not trigger bell alerts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Employee Selection Authentication & Single Session Control (Priority: P1)

An employee needs to log into the internal communication workspace by selecting their name from a verified staff roster and entering their assigned Employee ID (EID) as their password. The system must prevent simultaneous duplicate sessions under the same account so that identity and message integrity remain accurate.

**Why this priority**: Authentication and account identity are the primary entry gates. Without verified identity and session control, users cannot send, receive, or track messages.

**Independent Test**: Can be tested independently by selecting an employee name from the roster, authenticating with the corresponding EID, verifying successful access to the dashboard, and confirming that initiating a second login with the same credentials immediately invalidates the earlier session.

**Acceptance Scenarios**:

1. **Given** a pre-configured employee account with Name "Alice Smith" and EID "EMP101", **When** Alice selects "Alice Smith" on the login screen and submits "EMP101", **Then** the system grants access and displays the main chat interface.
2. **Given** an existing active session for Alice on Browser A, **When** Alice's credentials are submitted on Browser B, **Then** Browser B logs in successfully and Browser A's session is terminated with a notification indicating login from another location.
3. **Given** an employee attempting to login, **When** they submit an incorrect EID for the selected name, **Then** the system denies access with a clear error and does not allow entry.
4. **Given** any authenticated user, **When** they review account settings or profiles, **Then** no password modification or reset controls exist.

---

### User Story 2 - Real-Time Direct Messaging and Peer Group Chat with File Transfer (Priority: P2)

Employees need to communicate directly (one-on-one) or collaborate in flat, peer-to-peer groups in real time. They must also be able to attach and exchange files up to 50MB.

**Why this priority**: Real-time messaging and file exchange are the core functional utility of the platform for day-to-day employee collaboration.

**Independent Test**: Can be tested independently by having two logged-in users exchange direct messages, create a peer group, and exchange a 20MB document, verifying immediate delivery and downloadability without page refresh.

**Acceptance Scenarios**:

1. **Given** two active users, Alice and Bob, **When** Alice sends a direct message to Bob, **Then** Bob receives the message instantly in his Message view with an unread badge indicator.
2. **Given** an employee creating a new group, **When** they name the group and select colleagues to join, **Then** the group is established with equal peer rights where every member can post and invite participants.
3. **Given** an active chat session (direct or group), **When** a user uploads an image file under 50MB (PNG, JPG, GIF, WebP), **Then** the image is rendered inline in the conversation stream with click-to-enlarge; **When** uploading a non-image file under 50MB (e.g., PDF, ZIP, XLSX), **Then** the file is delivered as a downloadable attachment card displaying the filename, file size, and download button.
4. **Given** a user attempting to send a file, **When** the file size is 50MB or greater (e.g., 55MB archive), **Then** the system blocks the upload immediately and informs the user of the 50MB limit.

---

### User Story 3 - Persistent Global Navigation and Real-Time Notification Bell (Priority: P3)

Users navigating across different sections (Directory, MustRead, Messages, Groups, Relax) need immediate awareness of incoming messages, mentions, or announcements regardless of which view is currently active.

**Why this priority**: A unified navigation and top-level real-time alert system prevents users from missing urgent company communications and messages while browsing other tabs.

**Independent Test**: Can be tested independently by navigating between different sidebar tabs while an incoming message or announcement is triggered, verifying that the top notification bell increments in real time and offers quick access.

**Acceptance Scenarios**:

1. **Given** a user browsing any tab (e.g., EID Directory or Relax) or conversing in another channel, **When** a new direct message, an inactive group message, or a MustRead announcement arrives, **Then** the notification bell at the very top of the interface updates immediately with an incremented unread badge and plays a subtle audio chime; messages arriving in the currently active conversation do not trigger bell chime or badge increments.
2. **Given** a user clicking the top notification bell, **When** the notification dropdown opens, **Then** it displays a list of recent unread events that direct the user to the relevant conversation or announcement upon click.
3. **Given** the left sidebar navigation, **When** the user clicks "EID Directory", "MustRead", "Message", or "Group", **Then** the interface switches to that workspace section while preserving the top notification bar.
4. **Given** the left sidebar navigation, **When** the user clicks the "Relax" tab, **Then** the system displays a friendly placeholder screen indicating the section is reserved for future expansion.

---

### User Story 4 - MustRead Bulletin Board (Priority: P4)

Admins need to broadcast critical operational notices, and employees need a centralized bulletin board to read and acknowledge company-wide announcements.

**Why this priority**: Official notices and company-wide policies must have a dedicated, unmissable space separate from fast-moving casual chat streams.

**Independent Test**: Can be tested independently by having an Admin publish an announcement in MustRead, verifying that it appears in all employees' MustRead feed and triggers a real-time notification.

**Acceptance Scenarios**:

1. **Given** an Admin user in the MustRead section, **When** the Admin drafts and publishes an announcement with title and rich text, **Then** the notice is posted to the bulletin board and a notification is dispatched to all employees.
2. **Given** an Admin user, **When** the Admin edits or deletes an existing MustRead notice, **Then** the updated content or deletion reflects immediately across all employee views.
3. **Given** a regular User in the MustRead section, **When** viewing announcements, **Then** they can read the content but have no access to create, edit, or delete notices.

---

### User Story 5 - Administrative Moderation & User Roster Management (Priority: P5)

Administrators need tools to provision and deactivate employee accounts, as well as moderate content by removing inappropriate messages or groups.

**Why this priority**: Ensures data governance, identity lifecycle management, and content safety across the organization.

**Independent Test**: Can be tested independently by having an Admin create a new user, verify that user can now log in, delete an inappropriate message from a group, and delete an entire group.

**Acceptance Scenarios**:

1. **Given** an Admin in the management panel, **When** the Admin enters a new employee's Name, EID, and assigns the User or Admin role, **Then** the new employee immediately appears in the login roster and EID Directory.
2. **Given** an Admin, **When** the Admin removes an employee record, **Then** that account can no longer log in, and active sessions for that user are immediately terminated.
3. **Given** an Admin viewing any group conversation, **When** the Admin triggers message deletion on an inappropriate message, **Then** the message is purged for all participants. Direct 1-on-1 messages remain inaccessible to Admins.
4. **Given** an Admin, **When** the Admin deletes a group, **Then** the group is closed and removed from all member lists.
5. **Given** a regular User, **When** browsing messages or groups, **Then** they cannot delete another user's messages or remove administrative rosters.

---

### Edge Cases

- **Concurrent Duplicate Login**: If User A is connected and chatting, and another browser logs in with User A's credentials, the first session MUST receive a forced-logout notification and immediately lose messaging capabilities to prevent impersonation or race conditions.
- **File Transfer Network Interruption**: If a file upload is interrupted midway, the system MUST cleanly reject partial transfer, notify the sender, and not leave corrupt or dangling orphaned files.
- **Exact 50MB Boundary & Zero-Byte Files**: Files sized between 1 byte and 50.00MB (52,428,800 bytes) inclusive MUST be accepted via streaming without full-file RAM buffering; zero-byte empty files or any file of 52,428,801 bytes or larger MUST be blocked both client-side and server-side with a clear "File exceeds 50MB limit" error.
- **User Account Deletion While Connected**: When an Admin removes an employee while that employee is actively logged in, the active session MUST be terminated in real time and prevented from submitting new messages. The bootstrap `Super Administrator` (`SuperB22`) account is protected and immutable against deletion.
- **Empty or Whitespace-Only Messages**: Attempting to send an empty message without an attachment MUST be disabled and blocked by the interface.
- **Group Abandonment**: If all members leave a peer group, the group MUST be archived or automatically removed from active listings.
- **Rapid Bell Notifications**: If multiple messages arrive in rapid succession, the notification bell badge count MUST accurately reflect the cumulative unread total without glitching or dropping increments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST authenticate users exclusively through a two-step prompt: selecting an employee name from the active roster (where EIDs are strictly hidden on the public login screen) and entering their assigned EID (or `Super123` for `SuperB22`) as the password.
- **FR-002**: The system MUST NOT provide any password reset, password change, or self-service credential recovery feature.
- **FR-003**: The system MUST enforce a strict single active session rule per employee account, automatically invalidating any existing active session upon a successful new login.
- **FR-004**: The system MUST support two distinct user roles: `Admin` and `User`, hiding all administrative navigation tabs and moderation controls from `User` accounts and returning `403 Forbidden` if a standard user attempts an administrative API operation.
- **FR-005**: Only `Admin` users MUST be permitted to create and delete employee records (Name, EID, Shift, and Role assignment); the initial `SuperB22` Admin account MUST be protected from deletion.
- **FR-006**: Only `Admin` users MUST be permitted to create, edit, and delete announcements in the MustRead bulletin board.
- **FR-007**: Only `Admin` users MUST have moderation authority to delete any message in group chats and delete entire group channels; standard `User` accounts MUST NOT be permitted to delete messages in group chats, and private 1-on-1 direct messages MUST remain strictly confidential to the two participants and cannot be accessed, browsed, or deleted by Admins.
- **FR-008**: The system interface MUST feature a persistent, top-level header visible across all tabs and views, containing a real-time notification bell.
- **FR-009**: The notification bell MUST provide real-time unread count badges, play an optional subtle audio chime, and display an interactive dropdown list of recent notifications (direct messages, inactive group messages, and MustRead announcements); messages received inside the currently open, active conversation MUST NOT trigger bell increments or audio alerts.
- **FR-010**: The system interface MUST provide a left sidebar navigation with exactly five distinct items:
  1. `EID Directory`
  2. `MustRead Bulletin Board`
  3. `Direct Messages (Message)`
  4. `Group Chat`
  5. `Relax`
- **FR-011**: The `EID Directory` view MUST list all active employees with their Name, EID, and a quick-action button to initiate a direct message.
- **FR-012**: The `MustRead` view MUST display all published notices in chronological order with author, publication timestamp, and announcement body.
- **FR-013**: The `Direct Messages` view MUST enable real-time, bidirectional text and file messaging between any two authenticated employees.
- **FR-014**: The `Group Chat` view MUST enable any employee to create a flat, peer-to-peer group, invite colleagues, and engage in real-time group conversations with equal member permissions.
- **FR-015**: The `Relax` view MUST display an informative placeholder screen indicating that relaxation and wellness features are planned for future extension.
- **FR-016**: The system MUST support sending and downloading file attachments in both direct and group conversations, rendering image attachments (PNG, JPG, GIF, WebP) directly inline with click-to-enlarge preview, and rendering non-image attachments as structured cards showing filename, byte size, and download action.
- **FR-017**: The system MUST enforce a maximum file attachment size of strictly under 50MB per file, rejecting any larger file with an explicit validation error.
- **FR-018**: All user interface elements, notifications, system dialogues, and labels MUST be presented in English.

### Key Entities *(include if feature involves data)*

- **Employee**: Represents a company staff member. Key attributes: Name, EID (unique identifier and login password), Role (`Admin` or `User`), Status (`Active` or `Deactivated`), and Creation Timestamp.
- **Session**: Represents an active authenticated client session. Key attributes: Associated Employee, Session Token/Identifier, Login Timestamp, and Status (`Active` or `Revoked`).
- **Direct Conversation**: Represents a private messaging channel between two specific employees.
- **Group Conversation**: Represents a multi-party peer group channel. Key attributes: Group Name, Created By, Creation Timestamp, and Member Roster.
- **Message**: Represents an individual communication unit within a direct or group conversation. Key attributes: Sender, Target (Direct Conversation or Group), Text Content, Attachment Metadata (if present), Timestamp, and Moderation Status.
- **Attachment**: Represents an uploaded file. Key attributes: Original File Name, Storage Reference, File Size in Bytes (< 50MB), MIME Type, and Upload Timestamp.
- **Announcement (MustRead)**: Represents an official broadcast notice created by an Admin. Key attributes: Title, Content Body, Authoring Admin, Creation Timestamp, and Last Modified Timestamp.
- **Notification**: Represents a real-time alert delivered to an employee. Key attributes: Recipient, Notification Type (Direct Message, Group Message, MustRead Announcement), Reference Link, Read Status, and Timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select their name, submit their EID, and access their conversation workspace within 3 seconds under normal network conditions.
- **SC-002**: Direct messages and group messages appear on recipients' screens in under 500 milliseconds from the moment of dispatch.
- **SC-003**: 100% of simultaneous duplicate login attempts successfully revoke the prior active session within 1 second.
- **SC-004**: 100% of file upload attempts exceeding 50MB (52,428,800 bytes) are rejected prior to storage commitment.
- **SC-005**: The system maintains sub-second responsiveness and zero message loss with up to 100 active internal users operating concurrently.
- **SC-006**: Regular users are 100% restricted from accessing or executing administrative operations (user management, MustRead editing, arbitrary message deletion).
- **SC-007**: 95% of users can locate an employee in the EID Directory and initiate a direct message in under 15 seconds.

## Assumptions

- **Target Deployment**: The system is hosted on an internal corporate server and accessed via modern desktop web browsers across the local intranet.
- **Scale Ceiling**: The system is bounded to support up to 100 concurrent internal users in accordance with the project constitution.
- **Credential Model**: EID values are managed and distributed by company administration; employees do not need or have mechanisms to alter their passwords.
- **Session Handling**: When a duplicate login occurs, terminating the older session with an explanatory message is preferred over locking out the new login attempt, ensuring employees are not stranded if a tab or machine was left open elsewhere.
- **File Types**: All standard business file types (documents, spreadsheets, images, compressed archives) are permitted as long as individual file size is under 50MB.
- **Relax Section**: The Relax section serves as a designated placeholder tab in the sidebar navigation with no complex business logic required in this initial release.
