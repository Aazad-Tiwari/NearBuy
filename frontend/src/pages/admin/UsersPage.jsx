import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

/**
 * UsersPage — admin full user management table
 */
const ROLE_FILTERS = ['all', 'buyer', 'shopkeeper', 'admin'];

function RoleBadge({ role }) {
  const styles = {
    buyer: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    shopkeeper: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    admin: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${styles[role] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {role}
    </span>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { notify } = useApp();

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await adminAPI.getUsers();
        if (res.success) {
          setUsers(res.users);
        }
      } catch (err) {
        notify('error', err.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [notify]);

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = ROLE_FILTERS.reduce((acc, r) => {
    acc[r] = r === 'all' ? users.length : users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  const toggleActive = async (userId) => {
    try {
      const res = await adminAPI.toggleUserActive(userId);
      if (res.success && res.user) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: res.user.isActive } : u))
        );
        notify('success', `Account status updated.`);
      }
    } catch (err) {
      notify('error', err.message || 'Failed to update account status.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-800 rounded-xl" />
            <div className="h-4 w-64 bg-slate-800/60 rounded-xl" />
          </div>
          <div className="h-10 w-40 bg-slate-800/60 rounded-xl" />
        </div>
        <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
        <div className="card h-96 bg-slate-800/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient-admin">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">View and manage all registered accounts on the platform.</p>
        </div>
        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Buyers', count: counts.buyer, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'Shopkeepers', count: counts.shopkeeper, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          ].map((s) => (
            <div key={s.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}>
              {s.count} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Role filter */}
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                roleFilter === r
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700/40 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
              {counts[r] > 0 && <span className="ml-1.5 opacity-70">({counts[r]})</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="input-base pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <p className="text-3xl mb-2">👥</p>
                    No users found
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u._id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors group">
                  {/* User */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        u.role === 'buyer' ? 'bg-cyan-600/20 text-cyan-400' :
                        u.role === 'shopkeeper' ? 'bg-violet-600/20 text-violet-400' :
                        'bg-amber-600/20 text-amber-400'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="py-4 px-5"><RoleBadge role={u.role} /></td>
                  {/* Phone */}
                  <td className="py-4 px-5 text-xs text-slate-400">{u.phone || '—'}</td>
                  {/* Status */}
                  <td className="py-4 px-5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      u.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-700/40 text-slate-500 border-slate-600/30'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* Joined */}
                  <td className="py-4 px-5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  {/* Actions */}
                  <td className="py-4 px-5">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggleActive(u._id)}
                        className={`opacity-0 group-hover:opacity-100 transition-all text-xs px-3 py-1.5 rounded-xl font-medium border ${
                          u.isActive
                            ? 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10'
                            : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {u.role === 'admin' && (
                      <span className="text-xs text-slate-600">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/60 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-400 font-medium">{filteredUsers.length}</span> of{' '}
            <span className="text-slate-400 font-medium">{users.length}</span> users
          </p>
          <p className="text-xs text-slate-600">{users.filter((u) => u.isActive).length} active accounts</p>
        </div>
      </div>
    </div>
  );
}
