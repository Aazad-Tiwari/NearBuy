import React from 'react';
import AdminKPICards from './KPICards';
import ApprovalTable from './ApprovalTable';
import { useApp } from '../../context/AppContext';

/**
 * AdminView — KPI metrics + store approval management
 */
export default function AdminView() {
  const { pendingShops, approvedShops } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gradient-admin">Admin Dashboard</h1>
                <p className="text-slate-500 text-sm">Platform oversight and store approval management</p>
              </div>
            </div>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-3">
            {pendingShops.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-600/10 border border-amber-500/20 px-4 py-2 rounded-xl animate-pulse-ring">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-semibold text-amber-400">
                  {pendingShops.length} pending review
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                {approvedShops.length} live stores
              </span>
            </div>
          </div>
        </div>

        {/* KPI metrics */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Platform Metrics</h2>
          <AdminKPICards />
        </section>

        {/* Approval table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Store Registrations</h2>
            <p className="text-xs text-slate-600">Review each application and approve or reject</p>
          </div>
          <ApprovalTable />
        </section>

        {/* Recent activity feed (static) */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="card divide-y divide-slate-800/60">
            {[
              { icon: '✅', text: 'SportsPro Arena was approved', time: '2 days ago', color: 'text-emerald-400' },
              { icon: '✅', text: 'HealthFirst Pharmacy was approved', time: '3 weeks ago', color: 'text-emerald-400' },
              { icon: '❌', text: 'PageTurner Bookhouse was rejected — incomplete GST', time: '1 month ago', color: 'text-rose-400' },
              { icon: '📋', text: 'TechZone Electronics submitted registration', time: '5 days ago', color: 'text-slate-400' },
              { icon: '📋', text: 'Green Basket Organics submitted registration', time: '3 days ago', color: 'text-slate-400' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                <span className="text-lg shrink-0">{item.icon}</span>
                <p className={`flex-1 text-sm ${item.color}`}>{item.text}</p>
                <span className="text-xs text-slate-600 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
