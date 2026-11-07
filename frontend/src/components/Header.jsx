import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, ShieldCheck, Check, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Header({ onNavigate }) {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    clearNotification,
    soundEnabled,
    setSoundEnabled
  } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (notif.type === 'DirectMessage') {
      onNavigate('messages', notif.reference_id);
    } else if (notif.type === 'GroupMessage') {
      onNavigate('groups', notif.reference_id);
    } else if (notif.type === 'MustRead') {
      onNavigate('mustread');
    }
    setDropdownOpen(false);
  };

  const getShiftBadgeColor = (shift) => {
    switch (shift?.toLowerCase()) {
      case 'morning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'swing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 relative select-none shadow-sm">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          FTU
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">FTU Internal Chat</h1>
          <p className="text-[11px] text-slate-500 leading-none">Internal Communication Hub</p>
        </div>
      </div>

      {/* Right controls: Bell & Profile */}
      <div className="flex items-center space-x-4">
        {/* Real-time Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              if (!dropdownOpen && unreadCount > 0) {
                markAllNotificationsRead();
              }
            }}
            className="p-2 rounded-full hover:bg-slate-100 transition relative text-slate-600 hover:text-slate-900 focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full leading-none animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Notifications ({notifications.length})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded transition"
                    title={soundEnabled ? 'Sound Chime Enabled (Click to Mute)' : 'Sound Chime Muted (Click to Unmute)'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition flex items-start justify-between ${
                        !notif.is_read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              notif.type === 'MustRead'
                                ? 'bg-amber-500'
                                : notif.type === 'GroupMessage'
                                ? 'bg-indigo-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {notif.body}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {notif.created_at}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notif.id);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-300">
              {user.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                {user.role === 'Admin' && (
                  <span className="flex items-center text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded border border-purple-200">
                    <ShieldCheck className="w-3 h-3 mr-0.5" /> Admin
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                <span>EID: {user.eid}</span>
                <span>•</span>
                <span className={`px-1 rounded text-[10px] border font-medium ${getShiftBadgeColor(user.shift)}`}>
                  {user.shift}
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

