import React, { useState } from 'react';
import { Lock, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { roster, login, sessionAlert } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search by name or shift without exposing or matching EID
  const filteredRoster = roster.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.shift.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select your name from the staff roster');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(selectedUser.name, password.trim());
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl shadow-inner">
            FTU
          </div>
          <h2 className="text-xl font-bold">Internal Employee Portal</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Select your name and enter your password to access the workspace
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {sessionAlert && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Session Disconnected</p>
                <p>{sessionAlert}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Select Your Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name or shift..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Listbox */}
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {filteredRoster.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching employees found
                </div>
              ) : (
                filteredRoster.map((emp) => {
                  const isSelected = selectedUser?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(emp);
                        setError(null);
                      }}
                      className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            emp.role === 'Admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{emp.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                          emp.shift === 'Morning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : emp.shift === 'Swing'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {emp.shift}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedUser && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                Selected: <strong>{selectedUser.name}</strong> ({selectedUser.shift} Shift)
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                autoComplete="current-password"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Please enter your assigned credential to authenticate.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedUser}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Internal Communication Hub • Single Active Session Enforced
        </div>
      </div>
    </div>
  );
}
