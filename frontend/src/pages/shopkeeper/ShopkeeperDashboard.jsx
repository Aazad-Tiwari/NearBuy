import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

function formatPrice(p) {
  return `₹${Number(p || 0).toLocaleString('en-IN')}`;
}
function formatTime(dt) {
  if (!dt) return 'soon';
  const d = new Date(dt), now = new Date();
  const diff = Math.round((d - now) / 60000);
  if (diff < 0) return `${Math.abs(diff)}m ago`;
  if (diff < 60) return `in ${diff}m`;
  return `in ${Math.round(diff / 60)}h`;
}

const KPI_CARDS = [
  { key: 'pending',   label: 'Pending Orders',     icon: '📥', gradient: 'from-amber-400 to-orange-500',  text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100'   },
  { key: 'confirmed', label: 'Confirmed',           icon: '✅', gradient: 'from-blue-500 to-indigo-500',   text: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100'     },
  { key: 'ready',     label: 'Ready for Pickup',    icon: '📦', gradient: 'from-violet-500 to-fuchsia-500', text: 'text-violet-700',  bg: 'bg-violet-50 border-violet-100' },
  { key: 'revenue',   label: "Today's Revenue",     icon: '💰', gradient: 'from-emerald-500 to-teal-500',  text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100'},
];

export default function ShopkeeperDashboard() {
  const { user } = useAuth();
  const { shopkeeperOrders, products, shops } = useApp();
  const myShop = shops[0] || null;

  const kpiValues = {
    pending:  shopkeeperOrders.filter(o => o.status === 'pending').length,
    confirmed: shopkeeperOrders.filter(o => o.status === 'confirmed').length,
    ready:    shopkeeperOrders.filter(o => o.status === 'ready').length,
    revenue:  formatPrice(shopkeeperOrders.filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.totalAmount, 0)),
  };

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const recentOrders = shopkeeperOrders.slice(0, 5);
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <p className="text-gray-400 text-sm font-medium">{greeting}, <span className="text-gray-600 font-semibold">{user?.name?.split(' ')[0]}</span> 👋</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Shopkeeper Panel
          </h1>
          {myShop && (
            <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-2">
              🏪 <span className="font-semibold text-gray-700">{myShop.name}</span>
              <span className="text-gray-300">·</span>
              <span>📍 {myShop.address?.city}</span>
            </p>
          )}
        </div>

        {/* Store status badge */}
        {myShop ? (
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl self-start sm:self-auto border font-semibold text-sm ${
            myShop.approvalStatus === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            myShop.approvalStatus === 'pending'  ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                   'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${myShop.approvalStatus === 'approved' ? 'bg-emerald-500 animate-pulse' : myShop.approvalStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
            {myShop.approvalStatus === 'approved' ? 'Store Live & Active' :
             myShop.approvalStatus === 'pending'  ? 'Awaiting Approval' : 'Application Rejected'}
          </div>
        ) : (
          <Link to="/shopkeeper/store" className="btn-violet self-start sm:self-auto">
            + Apply for Store →
          </Link>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <div key={card.key}
            className={`rounded-2xl border p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-200 ${card.bg}`}
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/30 blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-current opacity-60 uppercase tracking-widest">{card.label}</p>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
              </div>
              <p className={`text-3xl font-black ${card.text} tracking-tight`} style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
                {kpiValues[card.key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ─────────────────────────────────────────────────── */}
      <div className="card shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-base" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>Weekly Revenue Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completed order revenue over the last 7 days</p>
          </div>
          <span className="badge badge-violet text-[10px]">Live Metrics</span>
        </div>
        <div className="relative w-full h-52">
          <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[40,80,120,160].map(y => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
            ))}
            {/* Area fill */}
            <path d="M 20 170 C 100 150, 150 80, 220 110 C 290 140, 370 50, 440 80 C 510 110, 590 30, 680 60 L 680 190 L 20 190 Z"
              fill="url(#revGrad2)" />
            {/* Line */}
            <path d="M 20 170 C 100 150, 150 80, 220 110 C 290 140, 370 50, 440 80 C 510 110, 590 30, 680 60"
              fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {[[220,110],[440,80],[590,30]].map(([cx,cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="6" fill="#7c3aed" stroke="white" strokeWidth="2.5" />
              </g>
            ))}
          </svg>
          <div className="absolute bottom-0 inset-x-0 flex justify-between text-[10px] text-gray-400 font-semibold px-2 pt-2 border-t border-gray-50">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* ── Recent Orders + Quick Actions ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-base" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>📋 Recent Orders</h2>
            <Link to="/shopkeeper/orders" className="text-xs text-violet-600 hover:text-violet-700 font-bold transition-colors">
              View all →
            </Link>
          </div>
          <div className="card shadow-card overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-14 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-bold text-gray-700 text-sm">No orders yet</p>
                <p className="text-gray-400 text-xs mt-1">New orders will appear here in real-time.</p>
              </div>
            ) : (
              <div>
                {recentOrders.map((order, idx) => (
                  <div key={order._id}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${idx < recentOrders.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 border border-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                        {(order.buyerId?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.buyerId?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Pickup {formatTime(order.pickupTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-emerald-600">{formatPrice(order.totalAmount)}</p>
                      <span className={`badge text-[9px] uppercase ${
                        order.status === 'pending'   ? 'badge-amber' :
                        order.status === 'confirmed' ? 'badge-blue' :
                        order.status === 'packed'    ? 'badge-blue' :
                        order.status === 'ready'     ? 'badge-violet' :
                                                       'badge-green'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Inventory Snapshot */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900 text-base" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>⚡ Quick Actions</h2>
          {[
            { to: '/shopkeeper/orders',    icon: '📥', label: 'Manage Orders',    desc: `${kpiValues.pending} pending`, gradient: 'from-amber-400 to-orange-400' },
            { to: '/shopkeeper/inventory', icon: '📦', label: 'Manage Inventory', desc: `${products.length} products`, gradient: 'from-violet-500 to-purple-500' },
            { to: '/shopkeeper/store',     icon: '🏪', label: 'Store Settings',   desc: myShop ? 'View & edit' : 'Apply now', gradient: 'from-blue-500 to-indigo-500' },
          ].map((action) => (
            <Link key={action.to} to={action.to}
              className="card card-hover flex items-center gap-4 p-4 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-600 transition-colors font-bold">→</span>
            </Link>
          ))}

          {/* Inventory quick stats */}
          <div className="card-soft-violet p-5 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Inventory Snapshot</p>
            {[
              { label: 'Total products',     value: products.length,                              color: 'text-gray-900' },
              { label: 'In stock',           value: products.filter(p => p.stock > 0).length,     color: 'text-emerald-700' },
              { label: 'Out of stock',       value: outOfStock,                                   color: outOfStock > 0 ? 'text-red-600' : 'text-gray-400' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-violet-100/50 last:border-0">
                <span className="text-xs font-medium text-gray-500">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
