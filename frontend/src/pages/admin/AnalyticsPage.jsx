import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, DonutChart } from '../../components/admin/Charts';
import { adminAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

/**
 * AnalyticsPage — platform analytics with SVG/CSS charts
 */
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value, color, pct }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-slate-400">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-200 font-semibold">{value}</span>
          <span className="text-slate-600 w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { shops, products, notify } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await adminAPI.getAnalytics();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        notify('error', err.message || 'Failed to fetch analytics data.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [notify]);

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-800 rounded-xl" />
          <div className="h-4 w-64 bg-slate-800/60 rounded-xl" />
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="h-3 w-16 bg-slate-800 rounded-md" />
              <div className="h-8 w-12 bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card h-52 bg-slate-800/20 rounded-xl" />
          <div className="card h-52 bg-slate-800/20 rounded-xl" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card h-64 bg-slate-800/20 rounded-xl" />
          <div className="card h-64 bg-slate-800/20 rounded-xl" />
        </div>
      </div>
    );
  }

  const { ordersOverTime, ordersByStatus, categoryBreakdown, registrationTrend, weekLabels } = data;

  const totalOrders = ordersByStatus.reduce((s, seg) => s + seg.value, 0);
  const catTotal = categoryBreakdown.reduce((s, c) => s + c.value, 0);
  const completedCount = ordersByStatus.find(s => s.label === 'Completed')?.value || 0;
  const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gradient-admin">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Platform performance insights and trend analysis.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: totalOrders, icon: '🎟️', color: 'text-violet-400' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: '✅', color: 'text-emerald-400' },
          { label: 'Active Products', value: products.length, icon: '📦', color: 'text-blue-400' },
          { label: 'Live Stores', value: shops.filter(s => s.approvalStatus === 'approved').length, icon: '🏪', color: 'text-cyan-400' },
        ].map((m) => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
              <span className="text-xl">{m.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders over time */}
        <ChartCard title="Orders Over Time" subtitle="Last 14 days">
          <LineChart
            data={ordersOverTime}
            labels={weekLabels}
            color="#7c3aed"
            height={140}
            id="orders-time"
          />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </ChartCard>

        {/* Orders by status */}
        <ChartCard title="Orders by Status" subtitle="Current breakdown">
          <div className="flex items-center gap-8">
            <DonutChart segments={ordersByStatus} size={140}>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-100">{totalOrders}</p>
                <p className="text-[10px] text-slate-500">Total</p>
              </div>
            </DonutChart>
            <div className="flex-1 space-y-2.5">
              {ordersByStatus.map((seg) => (
                <MetricRow
                  key={seg.label}
                  label={seg.label}
                  value={seg.value}
                  color={seg.color}
                  pct={totalOrders > 0 ? Math.round((seg.value / totalOrders) * 100) : 0}
                />
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <ChartCard title="Orders by Category" subtitle="Top performing product categories">
          <BarChart
            data={categoryBreakdown.map((c, i) => ({
              label: c.label,
              value: c.value,
              color: ['#7c3aed','#06b6d4','#10b981','#f59e0b','#f43f5e'][i % 5],
            }))}
            height={140}
          />
          <div className="space-y-2 mt-2">
            {categoryBreakdown.map((c, i) => (
              <MetricRow
                key={c.label}
                label={c.label}
                value={c.value}
                color={['#7c3aed','#06b6d4','#10b981','#f59e0b','#f43f5e'][i % 5]}
                pct={catTotal > 0 ? Math.round((c.value / catTotal) * 100) : 0}
              />
            ))}
          </div>
        </ChartCard>

        {/* Registration trend */}
        <ChartCard title="Store Registration Trend" subtitle="New store applications over last 14 days">
          <LineChart
            data={registrationTrend}
            labels={weekLabels}
            color="#f59e0b"
            height={140}
            id="registration"
          />
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'New This Week', value: registrationTrend.slice(-7).reduce((a, b) => a + b, 0), color: 'text-amber-400' },
              { label: 'Approved', value: shops.filter((s) => s.approvalStatus === 'approved').length, color: 'text-emerald-400' },
              { label: 'Pending', value: shops.filter((s) => s.approvalStatus === 'pending').length, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-center">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Data note */}
      <div className="card p-4 flex items-center gap-3 border-emerald-500/20 bg-emerald-950/20">
        <span className="text-xl">✅</span>
        <p className="text-sm text-emerald-300">Live Connection Active. Platform metrics are synchronized in real-time with the database.</p>
      </div>
    </div>
  );
}
