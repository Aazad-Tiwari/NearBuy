import React, { useState, useEffect } from 'react';
import { shopkeeperAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';

export default function AnalyticsPage() {
  const { notify } = useApp();
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, historyRes] = await Promise.all([
        shopkeeperAPI.getAnalytics(),
        shopkeeperAPI.getInventoryHistory()
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (historyRes.success) setTransactions(historyRes.transactions || []);
    } catch (err) {
      console.error('Failed to load shopkeeper analytics:', err);
      notify('error', 'Failed to retrieve store reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-44 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 h-28 bg-gray-50 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const { totalRevenue, totalOrders, labels = [], revenueTrend = [], countTrend = [], topProducts = [] } = analytics || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Reports & Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor sales analytics, product movements, and stock transaction history.</p>
        </div>
        <Button variant="secondary" onClick={fetchData} icon="🔄">
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2 bg-emerald-50/50 border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Sales Revenue</p>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">{formatPrice(totalRevenue || 0)}</p>
          <p className="text-xs text-emerald-600/70 mt-1">Earnings from all completed bookings</p>
        </div>

        <div className="card p-5 space-y-2 bg-violet-50/50 border-violet-100 shadow-sm">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Total Completed Bookings</p>
          <p className="text-3xl font-black text-violet-700 tracking-tight">{totalOrders || 0}</p>
          <p className="text-xs text-violet-600/70 mt-1">Orders collected or successfully delivered</p>
        </div>

        <div className="card p-5 space-y-2 bg-blue-50/50 border-blue-100 shadow-sm">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Average Transaction Value</p>
          <p className="text-3xl font-black text-blue-700 tracking-tight">
            {formatPrice(totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0)}
          </p>
          <p className="text-xs text-blue-600/70 mt-1">Average invoice size per customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales history */}
        <div className="lg:col-span-2 card p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Sales Activity Trends</h2>
            <p className="text-xs text-gray-400 mt-0.5">Completed order revenue tracking over the past 14 days</p>
          </div>

          {labels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-xs text-gray-400 italic text-center">No sales trend history yet. Complete your first order to see data here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-40 flex items-end gap-1.5 pt-6 pb-2 border-b border-gray-100">
                {revenueTrend.map((val, idx) => {
                  const maxVal = Math.max(...revenueTrend, 1);
                  const pct = Math.round((val / maxVal) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute bottom-full mb-1 text-[8px] bg-gray-900 text-white px-1.5 py-0.5 border border-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatPrice(val)}
                      </div>
                      <div
                        style={{ height: `${Math.max(4, pct)}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          val > 0
                            ? 'bg-gradient-to-t from-violet-600 to-fuchsia-500 group-hover:from-violet-500 group-hover:to-fuchsia-400 shadow-sm'
                            : 'bg-gray-100 border-t border-gray-200'
                        }`}
                      />
                      <span className="text-[8px] text-gray-400 font-mono mt-1 w-full truncate text-center">
                        {labels[idx]?.split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono">
                <span>{labels[0]}</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Selling Products */}
        <div className="card p-6 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">🏆 Top-Selling Products</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-xs text-gray-400 italic">No catalog sales logged yet.</p>
              </div>
            ) : (
              topProducts.map((p, idx) => {
                const maxQty = Math.max(...topProducts.map(item => item.value), 1);
                const pct = Math.round((p.value / maxQty) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 truncate pr-2">{p.label}</span>
                      <span className="text-gray-500 font-bold shrink-0">{p.value} units</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inventory Transaction History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">📦 Inventory Transaction History</h2>
          <p className="text-xs text-gray-400 mt-0.5">Chronological audit log tracking stock movement items.</p>
        </div>

        <div className="card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-bold tracking-wider text-[10px]">
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Product Name</th>
                  <th className="px-5 py-4 text-center">SKU</th>
                  <th className="px-5 py-4 text-center">Type</th>
                  <th className="px-5 py-4 text-center">Stock Δ</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 italic text-sm">
                      No stock movement transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const isPositive = t.quantityChange > 0;

                    let badgeClass = 'bg-gray-100 border-gray-200 text-gray-500';
                    if (t.type === 'restock')    badgeClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                    if (t.type === 'sale')        badgeClass = 'bg-blue-50 border-blue-200 text-blue-700';
                    if (t.type === 'return')      badgeClass = 'bg-rose-50 border-rose-200 text-rose-700';
                    if (t.type === 'adjustment')  badgeClass = 'bg-amber-50 border-amber-200 text-amber-700';

                    return (
                      <tr key={t._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4 text-gray-400 font-mono text-[10px]">
                          {new Date(t.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900 text-xs">
                          {t.productId?.name || <span className="text-gray-400 italic">Deleted Product</span>}
                        </td>
                        <td className="px-5 py-4 text-center text-gray-400 font-mono text-[10px]">
                          {t.productId?.sku || '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border ${badgeClass}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-center font-black text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${t.quantityChange}` : t.quantityChange}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-400 font-medium text-[10px]">
                          {t.details || (t.orderId ? `Order PIN: ${t.orderId.verificationCode}` : '—')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
