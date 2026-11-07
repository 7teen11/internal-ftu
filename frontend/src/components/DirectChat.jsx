import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Search,
  X,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function DirectChat({ targetUserId, onSelectUser }) {
  const { user, roster, token } = useAuth();
  const { socket, onlineUsers, setActiveChatContext } = useSocket();

  const [selectedPartnerId, setSelectedPartnerId] = useState(targetUserId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync targetUserId prop if passed
  useEffect(() => {
    if (targetUserId) {
      setSelectedPartnerId(targetUserId);
    } else if (!selectedPartnerId && roster.length > 0) {
      // Default to first colleague other than current user
      const other = roster.find((u) => u.id !== user.id);
      if (other) setSelectedPartnerId(other.id);
    }
  }, [targetUserId, roster, user.id]);

  // Set active chat context in socket provider so chime is silenced for this active conversation
  useEffect(() => {
    if (selectedPartnerId) {
      setActiveChatContext({ type: 'direct', id: selectedPartnerId });
    }
    return () => setActiveChatContext(null);
  }, [selectedPartnerId]);

  // Fetch messages when partner changes
  useEffect(() => {
    if (!selectedPartnerId || !token) return;

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/messages/direct/${selectedPartnerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    }

    fetchHistory();
  }, [selectedPartnerId, token]);

  // Socket listener for new incoming direct message
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // Check if message belongs to current open conversation
      if (
        (msg.sender_id === selectedPartnerId && msg.recipient_id === user.id) ||
        (msg.sender_id === user.id && msg.recipient_id === selectedPartnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    return () => socket.off('new_direct_message', handleNewMessage);
  }, [socket, selectedPartnerId, user.id]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePartnerSelect = (partnerId) => {
    setSelectedPartnerId(partnerId);
    if (onSelectUser) onSelectUser(partnerId);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size === 0) {
      setFileError('Empty (0-byte) files are not allowed.');
      setSelectedFile(null);
      return;
    }

    // Strict 50MB ceiling check (52,428,800 bytes)
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
    if (!selectedPartnerId || !socket) return;

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

      // Send via socket
      socket.emit('send_direct_message', {
        recipient_id: selectedPartnerId,
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
      setFileError(err.message || 'Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const partnerUser = roster.find((u) => u.id === selectedPartnerId);

  const filteredColleagues = roster
    .filter((u) => u.id !== user.id)
    .filter(
      (u) =>
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.eid || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        u.shift.toLowerCase().includes(searchUser.toLowerCase())
    );

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Left conversation list */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredColleagues.map((colleague) => {
            const isSelected = colleague.id === selectedPartnerId;
            const isOnline = onlineUsers.includes(colleague.id);
            return (
              <button
                key={colleague.id}
                onClick={() => handlePartnerSelect(colleague.id)}
                className={`w-full p-3 text-left flex items-center space-x-3 transition ${
                  isSelected ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                    {colleague.name.charAt(0)}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{colleague.name}</span>
                    <span className="text-[10px] text-slate-400">{colleague.eid}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                    <span className="truncate">{colleague.shift} Shift</span>
                    {isOnline && <span className="text-[10px] text-emerald-600 font-medium">Online</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right chat stream */}
      {partnerUser ? (
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {/* Chat Top Banner */}
          <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {partnerUser.name.charAt(0)}
                </div>
                {onlineUsers.includes(partnerUser.id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <span>{partnerUser.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-slate-100 text-slate-600 border border-slate-200">
                    EID: {partnerUser.eid}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {partnerUser.shift} Shift •{' '}
                  {onlineUsers.includes(partnerUser.id) ? (
                    <span className="text-emerald-600 font-medium">Online</span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <User className="w-10 h-10 mb-2 text-slate-300" />
                <p>Start a 1-on-1 direct conversation with {partnerUser.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Private and confidential between you two</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const isImage = msg.file_mime?.startsWith('image/');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      {/* Text content */}
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                      {/* File attachment preview */}
                      {msg.file_path && (
                        <div className="mt-2">
                          {isImage ? (
                            <div className="relative group overflow-hidden rounded-lg cursor-pointer max-w-sm">
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
              placeholder={`Message ${partnerUser.name}...`}
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
          Select a colleague to start chatting
        </div>
      )}

      {/* Lightbox for Zooming Images */}
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

