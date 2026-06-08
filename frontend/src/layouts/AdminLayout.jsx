import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import NotificationsBell from '../components/common/NotificationsBell';

/**
 * AdminLayout — wide sidebar with amber accent, top bar with admin badge
 */
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/stores', label: 'Store Approvals', icon: '🏪', badgeKey: 'pending' },
  { to: '/admin/users', label: 'User Management', icon: '👥' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
];

function AdminSidebar({ pendingCount, mobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-full shadow-sm">
      {/* Brand */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-base text-white">⚙️</div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">NearBuy Admin</p>
            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">PLATFORM ADMIN</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={mobileClose}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-3 rounded-xl text-amber-700 bg-amber-50 border border-amber-100/60 font-semibold text-sm w-full'
                : 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-150 font-medium text-sm w-full'
            }
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.badgeKey === 'pending' && pendingCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-100">
          <button
            disabled
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 font-medium text-sm w-full cursor-not-allowed"
            title="Coming soon"
          >
            <span className="text-lg w-6 text-center">⚙️</span>
            <span>Settings</span>
            <span className="ml-auto text-[9px] text-slate-400 border border-slate-200 px-1.5 rounded bg-slate-50">Soon</span>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-sm font-extrabold text-amber-600">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/', { replace: true }); }}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-rose-600 py-2.5 rounded-xl hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100 font-semibold"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const { shops } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = shops.filter((s) => s.approvalStatus === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 modal-backdrop lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar pendingCount={pendingCount} mobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/85 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            ☰
          </button>
          <div className="flex-1" />
          {pendingCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full animate-pulse-ring">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount} store{pendingCount !== 1 ? 's' : ''} pending
            </div>
          )}
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <span className="text-xs text-slate-400 font-bold hidden sm:block">Admin Console</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        className="fixed bottom-4 right-4 z-50 lg:hidden w-12 h-12 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-lg text-white text-lg font-bold transition-colors"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
