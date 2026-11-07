import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, Shield, Calendar, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function MustRead() {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/mustread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to load MustRead feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnnouncements();
  }, [token]);

  // Socket real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNew = (announcement) => {
      setAnnouncements((prev) => [announcement, ...prev]);
    };

    const handleUpdate = (updated) => {
      setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    };

    const handleDelete = ({ id }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    };

    socket.on('new_mustread_announcement', handleNew);
    socket.on('mustread_updated', handleUpdate);
    socket.on('mustread_deleted', handleDelete);

    return () => {
      socket.off('new_mustread_announcement', handleNew);
      socket.off('mustread_updated', handleUpdate);
      socket.off('mustread_deleted', handleDelete);
    };
  }, [socket]);

  const handleOpenEditor = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setContent(item.content);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
    }
    setShowEditor(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const url = editingId ? `/api/mustread/${editingId}` : '/api/mustread';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: title.trim(), content: content.trim() })
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingId) {
          setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? saved : a)));
        } else {
          setAnnouncements((prev) => [saved, ...prev]);
        }
        setShowEditor(false);
      }
    } catch (err) {
      alert('Failed to save announcement: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const res = await fetch(`/api/mustread/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error('Failed to acknowledge notice:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this announcement?')) return;
    try {
      const res = await fetch(`/api/mustread/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      alert('Failed to delete announcement: ' + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-4xl w-full mx-auto space-y-5">
        {/* Header Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">MustRead Bulletin Board</h2>
              <p className="text-xs text-slate-500">
                Official company announcements and shift directives
              </p>
            </div>
          </div>

          {user?.role === 'Admin' && (
            <button
              onClick={() => handleOpenEditor()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Post Notice</span>
            </button>
          )}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No MustRead announcements posted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider inline-block">
                      Official Notice
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>

                  {user?.role === 'Admin' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditor(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition"
                        title="Edit Notice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      <span>Posted by {item.author_name}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {(() => {
                    let ackList = [];
                    try {
                      ackList = JSON.parse(item.acknowledged_by || '[]');
                    } catch {}
                    const hasAcked = ackList.includes(user?.id);

                    return (
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-500">
                          {ackList.length} read receipt{ackList.length === 1 ? '' : 's'}
                        </span>
                        <button
                          onClick={() => !hasAcked && handleAcknowledge(item.id)}
                          disabled={hasAcked}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition ${
                            hasAcked
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{hasAcked ? 'Acknowledged' : 'Acknowledge Read'}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit MustRead Announcement' : 'Draft New Announcement'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Notice title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Announcement Body
                </label>
                <textarea
                  rows={5}
                  placeholder="Write announcement details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  {submitting ? 'Broadcasting...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

