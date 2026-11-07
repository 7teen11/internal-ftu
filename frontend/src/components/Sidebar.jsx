import React from 'react';
import {
  Users,
  Megaphone,
  MessageSquare,
  UsersRound,
  Coffee,
  Shield,
  Circle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Sidebar({ activeTab, onSelectTab }) {
  const { user } = useAuth();
  const { onlineUsers, notifications } = useSocket();

  const unreadDirect = notifications.filter((n) => !n.is_read && n.type === 'DirectMessage').length;
  const unreadGroup = notifications.filter((n) => !n.is_read && n.type === 'GroupMessage').length;
  const unreadMustRead = notifications.filter((n) => !n.is_read && n.type === 'MustRead').length;

  const navItems = [
    {
      id: 'directory',
      label: 'EID Directory',
      icon: Users,
      badge: null,
      unread: 0
    },
    {
      id: 'mustread',
      label: 'MustRead',
      icon: Megaphone,
      badge: 'Board',
      unread: unreadMustRead
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: null,
      unread: unreadDirect
    },
    {
      id: 'groups',
      label: 'Group Chat',
      icon: UsersRound,
      badge: 'Peer',
      unread: unreadGroup
    },
    {
      id: 'relax',
      label: 'Relax',
      icon: Coffee,
      badge: 'Soon',
      unread: 0
    }
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col justify-between select-none border-r border-slate-800">
      <div className="p-3 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.unread > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full leading-none">
                      {item.unread}
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Admin section if applicable */}
        {user?.role === 'Admin' && (
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="px-3 pb-2 text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Administration</span>
            </div>
            <button
              onClick={() => onSelectTab('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-purple-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin Management</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Online indicator footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-slate-400 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px]">Internal Network</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">
          {onlineUsers.length} online
        </span>
      </div>
    </aside>
  );
}

