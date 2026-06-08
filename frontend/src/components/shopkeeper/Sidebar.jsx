import React from 'react';

/**
 * Sidebar — shopkeeper navigation sidebar
 */
const NAV_ITEMS = [
  { id: 'orders', label: 'Incoming Orders', icon: '📥', description: 'Track & process pickups' },
  { id: 'inventory', label: 'Inventory Stock', icon: '📦', description: 'Manage product catalogue' },
  { id: 'apply', label: 'Apply For Store', icon: '🏪', description: 'Register your storefront' },
];

export default function Sidebar({ activeSection, onSectionChange, orderCounts = {} }) {
  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col p-4 gap-1">
      {/* Branding */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm">
            🏪
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Shopkeeper Panel</p>
            <p className="text-[10px] text-slate-500">NearBuy Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const count = orderCounts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full text-left transition-all duration-150 rounded-xl px-3 py-3 ${
                isActive
                  ? 'bg-violet-600/15 border border-violet-500/20 text-violet-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-violet-200' : ''}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-sm">
            SK
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">My Store</p>
            <p className="text-[10px] text-slate-500">SportsPro Arena</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
