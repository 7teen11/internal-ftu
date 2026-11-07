import React, { useState } from 'react';
import { Shield, UserPlus, Trash2, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user, roster, token, refreshRoster } = useAuth();
  const [eid, setEid] = useState('');
  const [name, setName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [role, setRole] = useState('User');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!eid.trim() || !name.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eid: eid.trim(),
          name: name.trim(),
          shift,
          role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setStatusMsg({ type: 'success', text: `Employee ${name} (${eid}) added successfully!` });
      setEid('');
      setName('');
      setShift('Morning');
      setRole('User');
      refreshRoster();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (emp) => {
    if ((emp.eid || '').toUpperCase() === 'SUPERB22') {
      alert('Super Administrator cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate and remove ${emp.name} (${emp.eid})?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${emp.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Removed ${emp.name} from the system.` });
        refreshRoster();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete employee');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Administration & Governance</h2>
            <p className="text-xs text-slate-500">
              Provision employee accounts, assign shifts, and manage platform permissions
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Create Employee Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Add New Employee</span>
          </h3>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">EID</label>
              <input
                type="text"
                placeholder="e.g. TA2401"
                value={eid}
                onChange={(e) => setEid(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. David Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Swing">Swing Shift</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="User">User (Standard)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !eid.trim() || !name.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                {submitting ? 'Creating...' : 'Provision Employee'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Accounts Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Current System Users ({roster.length})</span>
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">EID</th>
                  <th className="py-2.5 px-4">Shift</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{emp.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{emp.eid}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">
                        {emp.shift}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {emp.role === 'Admin' ? (
                        <span className="font-semibold text-purple-700 text-[11px]">Admin</span>
                      ) : (
                        'User'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {(emp.eid || '').toUpperCase() !== 'SUPERB22' ? (
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete Employee Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

