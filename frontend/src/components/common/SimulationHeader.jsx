import React from 'react';
import { useApp } from '../../context/AppContext';

// Role configuration
const ROLES = [
  {
    id: 'buyer',
    label: 'Buyer',
    icon: '🛍️',
    description: 'Search & book pickups',
    gradient: 'from-blue-600 to-indigo-600',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-200',
    activeText: 'text-blue-600',
  },
  {
    id: 'shopkeeper',
    label: 'Shopkeeper',
    icon: '🏪',
    description: 'Manage store & orders',
    gradient: 'from-violet-600 to-fuchsia-600',
    activeBg: 'bg-violet-50',
    activeBorder: 'border-violet-200',
    activeText: 'text-violet-600',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: '⚙️',
    description: 'Review & approve stores',
    gradient: 'from-amber-500 to-orange-500',
    activeBg: 'bg-amber-50',
    activeBorder: 'border-amber-200',
    activeText: 'text-amber-700',
  },
];

export default function SimulationHeader() {
  const { activeRole, setRole, notification } = useApp();
  const activeConfig = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <div className="sticky top-0 z-50">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-slide-down border text-sm font-semibold max-w-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-glow-emerald'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-glow-rose'
              : 'bg-blue-50 border-blue-200 text-blue-800 shadow-glow'
          }`}
        >
          <span className="text-base">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Demo Banner */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        {/* DEMO Mode tag */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Demo Mode — Role Simulator Active
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">NearBuy v1.0</div>
        </div>

        {/* Main header */}
        <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-lg text-white shadow-sm`}>
              🛍️
            </div>
            <div>
              <div className="text-base font-bold text-slate-800 leading-tight">NearBuy</div>
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Local Discover & Pickup</div>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex-1 flex flex-wrap items-center gap-2 sm:justify-center">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:block">Simulate:</span>
            {ROLES.map((role) => {
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setRole(role.id)}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all duration-200 text-xs font-semibold ${
                    isActive
                      ? `${role.activeBg} ${role.activeBorder} ${role.activeText} shadow-sm border`
                      : 'border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">{role.icon}</span>
                  <span>{role.label}</span>
                  {isActive && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${role.gradient} text-white font-bold ml-1`}>
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current view info */}
          <div className={`shrink-0 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl ${activeConfig.activeBg} border ${activeConfig.activeBorder}`}>
            <span className="text-base">{activeConfig.icon}</span>
            <div>
              <div className={`text-xs font-bold ${activeConfig.activeText}`}>{activeConfig.label} View</div>
              <div className="text-[10px] text-slate-400">{activeConfig.description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
