import React, { useState } from 'react';
import { Search, MessageSquare, Shield, Users, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Directory({ onStartChat }) {
  const { user, roster } = useAuth();
  const { onlineUsers } = useSocket();
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  const filtered = roster.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.eid || '').toLowerCase().includes(search.toLowerCase());
    const matchesShift =
      shiftFilter === 'ALL' || emp.shift.toUpperCase() === shiftFilter.toUpperCase();
    return matchesSearch && matchesShift;
  });

  const getShiftBadge = (shift) => {
    switch (shift?.toLowerCase()) {
      case 'morning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'swing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 p-6">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full space-y-4">
        {/* Title and stats banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>EID Employee Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified corporate roster • {roster.length} registered employees
            </p>
          </div>

          {/* Search & Shift filter */}
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or EID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Shifts</option>
              <option value="MORNING">Morning Shift</option>
              <option value="SWING">Swing Shift</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">EID</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const isOnline = onlineUsers.includes(emp.id);
                  const isSelf = emp.id === user.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">{emp.name}</span>
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {emp.eid}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getShiftBadge(emp.shift)}`}>
                          {emp.shift}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp.role === 'Admin' ? (
                          <span className="inline-flex items-center text-purple-700 font-semibold text-[11px]">
                            <Shield className="w-3 h-3 mr-1" /> Admin
                          </span>
                        ) : (
                          'Staff'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-[11px] text-slate-600">
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => onStartChat(emp.id)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {roster.length} staff members</span>
            <span>Internal Enterprise Roster</span>
          </div>
        </div>
      </div>
    </div>
  );
}

