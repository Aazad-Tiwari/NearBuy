import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import NotificationsBell from '../components/common/NotificationsBell';

const NAV_ITEMS = [
  { to: '/shopkeeper',           label: 'Dashboard',      icon: '🏠', end: true },
  { to: '/shopkeeper/orders',    label: 'Incoming Orders', icon: '📥' },
  { to: '/shopkeeper/inventory', label: 'Inventory',       icon: '📦' },
  { to: '/shopkeeper/store',     label: 'My Store',        icon: '🏪' },
  { to: '/shopkeeper/analytics', label: 'Analytics',       icon: '📊' },
];

function ShopkeeperSidebar({ pendingCount, mobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { shops } = useApp();
  const myShop = shops[0] || null;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      {/* Brand */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-sm">
            🏪
          </div>
          <div>
            <p className="text-sm font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</p>
            <span className="text-[9px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-bold">SHOPKEEPER</span>
          </div>
        </div>
        {myShop && (
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
            myShop.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            myShop.approvalStatus === 'pending'  ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                   'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              myShop.approvalStatus === 'approved' ? 'bg-emerald-500 animate-pulse' :
              myShop.approvalStatus === 'pending'  ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="truncate max-w-[140px]">{myShop.name}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={mobileClose}
            className={({ isActive }) => isActive
              ? 'flex items-center gap-3 px-4 py-3 rounded-xl text-violet-700 bg-violet-50 border border-violet-100 font-bold text-sm w-full'
              : 'flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 font-medium text-sm w-full'
            }
          >
            <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.label === 'Incoming Orders' && pendingCount > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-black text-white shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/', { replace: true }); }}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-600 py-2.5 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 font-semibold"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function ShopkeeperLayout() {
  const { shopkeeperOrders } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = shopkeeperOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 modal-backdrop lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <ShopkeeperSidebar pendingCount={pendingCount} mobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 app-navbar px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full animate-pulse-glow">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {pendingCount} order{pendingCount !== 1 ? 's' : ''} need attention
              </div>
            )}
            <NotificationsBell />
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 lg:hidden w-13 h-13 bg-violet-600 hover:bg-violet-700 rounded-2xl flex items-center justify-center shadow-lg text-white text-lg transition-all hover:scale-105 active:scale-95"
        style={{width:'52px', height:'52px'}}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
