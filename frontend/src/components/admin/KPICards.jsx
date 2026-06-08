import React from 'react';
import KPICard from '../common/KPICard';
import { useApp } from '../../context/AppContext';

/**
 * KPICards — admin dashboard metrics row
 */
export default function AdminKPICards() {
  const { shops, buyerOrders, products } = useApp();

  const totalShops = shops.length;
  const pendingShops = shops.filter((s) => s.approvalStatus === 'pending').length;
  const approvedShops = shops.filter((s) => s.approvalStatus === 'approved').length;
  const rejectedShops = shops.filter((s) => s.approvalStatus === 'rejected').length;
  const totalOrders = buyerOrders.length;
  const completedOrders = buyerOrders.filter((o) => o.status === 'completed').length;

  const metrics = [
    {
      label: 'Total Registrations',
      value: totalShops,
      icon: '🏪',
      colorClass: 'text-violet-400',
      bgClass: 'bg-violet-600/10',
      borderClass: 'border-violet-500/20',
      trendLabel: 'all time',
    },
    {
      label: 'Pending Review',
      value: pendingShops,
      icon: '⏳',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-600/10',
      borderClass: 'border-amber-500/20',
      trendLabel: 'awaiting action',
    },
    {
      label: 'Approved Stores',
      value: approvedShops,
      icon: '✅',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-600/10',
      borderClass: 'border-emerald-500/20',
      trendLabel: 'live on platform',
    },
    {
      label: 'Rejected',
      value: rejectedShops,
      icon: '❌',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-600/10',
      borderClass: 'border-rose-500/20',
      trendLabel: 'total rejections',
    },
    {
      label: 'Total Products',
      value: products.length,
      icon: '📦',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-600/10',
      borderClass: 'border-blue-500/20',
      trendLabel: 'in catalogue',
    },
    {
      label: 'Pickup Orders',
      value: `${completedOrders}/${totalOrders}`,
      icon: '🎟️',
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-600/10',
      borderClass: 'border-cyan-500/20',
      trendLabel: 'completed / total',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((m, idx) => (
        <KPICard key={idx} {...m} />
      ))}
    </div>
  );
}
