import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  UsersRound,
  Plus,
  Trash2,
  X,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function GroupChat({ targetGroupId, onSelectGroup }) {
  const { user, roster, token } = useAuth();
  const { socket, setActiveChatContext } = useSocket();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(targetGroupId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [inviteMembers, setInviteMembers] = useState([]);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (!selectedGroupId && data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  useEffect(() => {
    if (targetGroupId) {
      setSelectedGroupId(targetGroupId);
    }
  }, [targetGroupId]);

  // Set active chat context so bell doesn't chime for this open group
  useEffect(() => {
    if (selectedGroupId) {
      setActiveChatContext({ type: 'group', id: selectedGroupId });
    }
    return () => setActiveChatContext(null);
  }, [selectedGroupId]);

  // Fetch messages when group changes
  useEffect(() => {
    if (!selectedGroupId || !token) return;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/group/${selectedGroupId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch group messages:', err);
      }
    }

    fetchMessages();
  }, [selectedGroupId, token]);

  // Socket listeners for group events
  useEffect(() => {
    if (!socket) return;

    const handleNewGroupMessage = (msg) => {
      if (msg.group_id === selectedGroupId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageDeleted = ({ message_id, group_id }) => {
      if (group_id === selectedGroupId) {
        setMessages((prev) => prev.filter((m) => m.id !== message_id));
      }
    };

    const handleGroupDeleted = ({ group_id }) => {
      setGroups((prev) => prev.filter((g) => g.id !== group_id));
      if (selectedGroupId === group_id) {
        setSelectedGroupId(null);
        setMessages([]);
      }
    };

    const handleGroupUpdated = (updatedGroup) => {
      setGroups((prev) => {
        const exists = prev.some((g) => g.id === updatedGroup.id);
        if (exists) {
          return prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
        }
        return [updatedGroup, ...prev];
      });
      socket.emit('join_group_room', { group_id: updatedGroup.id });
    };

    socket.on('new_group_message', handleNewGroupMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('group_deleted', handleGroupDeleted);
    socket.on('group_updated', handleGroupUpdated);

    return () => {
      socket.off('new_group_message', handleNewGroupMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('group_deleted', handleGroupDeleted);
      socket.off('group_updated', handleGroupUpdated);
    };
  }, [socket, selectedGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          members: selectedMembers
        })
      });

      if (res.ok) {
        const created = await res.json();
        setGroups((prev) => [created, ...prev]);
        setSelectedGroupId(created.id);
        setShowCreateModal(false);
        setNewGroupName('');
        setSelectedMembers([]);

        if (socket) {
          socket.emit('join_group_room', { group_id: created.id });
        }
      }
    } catch (err) {
      console.error('Group creation failed:', err);
    }
  };

  const handleInviteMembers = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || inviteMembers.length === 0) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ members: inviteMembers })
      });

      if (res.ok) {
        const updated = await res.json();
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setShowInviteModal(false);
        setInviteMembers([]);
      }
    } catch (err) {
      console.error('Failed to invite members:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size === 0) {
      setFileError('Empty (0-byte) files are not allowed.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileError('File exceeds 50MB limit (max 50.00 MB).');
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    if (!selectedGroupId || !socket) return;

    setUploading(true);
    let uploadedFileData = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const uploadJson = await res.json();
        if (!res.ok) {
          throw new Error(uploadJson.error || 'File upload failed');
        }
        uploadedFileData = uploadJson;
      }

      socket.emit('send_group_message', {
        group_id: selectedGroupId,
        content: inputText.trim(),
        file_path: uploadedFileData?.file_path || null,
        file_name: uploadedFileData?.file_name || null,
        file_size: uploadedFileData?.file_size || null,
        file_mime: uploadedFileData?.file_mime || null
      });

      setInputText('');
      setSelectedFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setFileError(err.message || 'Failed to send group message');
    } finally {
      setUploading(false);
    }
  };

  // Admin moderation: delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to remove this message for all group members?')) return;
    try {
      await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  // Admin moderation: delete group
  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to permanently delete this group channel?')) return;
    try {
      await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      alert('Failed to delete group: ' + err.message);
    }
  };

  const currentGroup = groups.find((g) => g.id === selectedGroupId);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Left Groups Column */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Peer Groups ({groups.length})
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
            title="Create New Peer Group"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {groups.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No groups yet. Click "+ New" to establish a peer group.
            </div>
          ) : (
            groups.map((group) => {
              const isSelected = group.id === selectedGroupId;
              let memberCount = 0;
              try {
                memberCount = JSON.parse(group.members || '[]').length;
              } catch {}

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    if (onSelectGroup) onSelectGroup(group.id);
                  }}
                  className={`w-full p-3 text-left flex items-center space-x-3 transition ${
                    isSelected ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <UsersRound className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{group.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {memberCount} members • Flat peer group
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Group Chat Stream */}
      {currentGroup ? (
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {/* Header */}
          <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                <UsersRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <span>{currentGroup.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Peer Group Chat • Equal Member Permissions
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Equal-rights Member Invite Button */}
              <button
                onClick={() => {
                  setInviteMembers([]);
                  setShowInviteModal(true);
                }}
                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Invite Colleagues to Group"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Members</span>
              </button>

              {/* Admin Delete Group Button */}
              {user?.role === 'Admin' && (
                <button
                  onClick={() => handleDeleteGroup(currentGroup.id)}
                  className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                  title="Admin: Delete Group Channel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Group</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <UsersRound className="w-10 h-10 mb-2 text-slate-300" />
                <p>Welcome to {currentGroup.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All members can send messages and share files</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const isImage = msg.file_mime?.startsWith('image/');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-semibold text-slate-600 mb-0.5 px-1">
                        {msg.sender_name} ({msg.sender_eid})
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      {/* Admin Delete Message Button on Hover */}
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 transition"
                          title="Admin: Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                        {msg.file_path && (
                          <div className="mt-2">
                            {isImage ? (
                              <div className="relative overflow-hidden rounded-lg cursor-pointer max-w-sm">
                                <img
                                  src={msg.file_path}
                                  alt={msg.file_name || 'Attached image'}
                                  onClick={() => setEnlargedImage(msg.file_path)}
                                  className="max-h-60 w-auto rounded-lg object-contain bg-slate-900/10 hover:opacity-95 transition"
                                />
                                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                  <span className="truncate">{msg.file_name}</span>
                                  <span>{formatFileSize(msg.file_size)}</span>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={msg.file_path}
                                download={msg.file_name}
                                className={`flex items-center space-x-2.5 p-2.5 rounded-lg border transition ${
                                  isMe
                                    ? 'bg-emerald-700/60 border-emerald-500 text-white hover:bg-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                <FileText className="w-5 h-5 shrink-0 text-emerald-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs truncate">{msg.file_name}</p>
                                  <p className="text-[10px] opacity-80">{formatFileSize(msg.file_size)}</p>
                                </div>
                                <Download className="w-4 h-4 shrink-0 opacity-70 hover:opacity-100" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Chip */}
          {selectedFile && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-2 truncate">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold truncate">{selectedFile.name}</span>
                <span className="text-[11px] text-emerald-700">({formatFileSize(selectedFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {fileError && (
            <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
              title="Attach File or Image (< 50MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Message ${currentGroup.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
            />

            <button
              type="submit"
              disabled={uploading || (!inputText.trim() && !selectedFile)}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Select or create a peer group to start collaborating
        </div>
      )}

      {/* Modal: Create Peer Group */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Peer Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Morning Handover, Project Delta..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Members
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
                  {roster
                    .filter((u) => u.id !== user.id)
                    .map((emp) => {
                      const isChecked = selectedMembers.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, emp.id]);
                                } else {
                                  setSelectedMembers(selectedMembers.filter((id) => id !== emp.id));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-medium text-slate-800">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">({emp.eid})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{emp.shift}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Members to Existing Group */}
      {showInviteModal && currentGroup && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Invite Colleagues to {currentGroup.name}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMembers} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Colleagues to Add
                </label>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
                  {(() => {
                    let currentMemberIds = [];
                    try {
                      currentMemberIds = JSON.parse(currentGroup.members || '[]');
                    } catch {}
                    const availableColleagues = roster.filter(
                      (u) => !currentMemberIds.includes(u.id)
                    );

                    if (availableColleagues.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400">
                          All colleagues are already members of this group.
                        </div>
                      );
                    }

                    return availableColleagues.map((emp) => {
                      const isChecked = inviteMembers.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setInviteMembers([...inviteMembers, emp.id]);
                                } else {
                                  setInviteMembers(inviteMembers.filter((id) => id !== emp.id));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-medium text-slate-800">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">({emp.eid})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{emp.shift}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMembers.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Invite ({inviteMembers.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged Image Lightbox */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedImage}
              alt="Enlarged preview"
              className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

