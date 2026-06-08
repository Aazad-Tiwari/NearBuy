import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { adminAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';

/**
 * AdminDashboard — platform KPIs, pending alert, recent registrations, activity log + CRUD consoles
 */
function KPICard({ label, value, icon, colorClass, glowBgClass }) {
  return (
    <div className="card p-5 relative group overflow-hidden transition-all duration-350 hover:-translate-y-1 border-slate-205 bg-white shadow-sm hover:shadow-md">
      {/* Visual radial glow overlay */}
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-300 ${glowBgClass}`} />
      
      <div className="flex items-center justify-between mb-3.5 z-10 relative">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
        <span className="text-xl filter drop-shadow-sm">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2 z-10 relative">
        <p className={`text-2xl font-black ${colorClass} tracking-tight`}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelativeTime(dt) {
  const diffMs = new Date() - new Date(dt);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-64 bg-slate-200/60 rounded-xl" />
        </div>
        <div className="h-10 w-44 bg-slate-200/60 rounded-xl" />
      </div>

      {/* KPIs Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-5 space-y-4 bg-white border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
              <div className="h-5 w-5 bg-slate-100 rounded-full" />
            </div>
            <div className="h-8 w-12 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminStats, loadingData, notify } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  // Categories Tab State
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🏪');

  // Reviews Tab State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fraud Monitoring State
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loadingFraud, setLoadingFraud] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Trigger data fetching on tab activation
  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'fraud') {
      fetchFraudAlerts();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await adminAPI.getCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (err) {
      notify('error', 'Failed to retrieve product categories.');
    } finally {
      setLoadingCats(false);
    }
  };

  const handleOpenCatModal = (cat = null) => {
    setCurrentCat(cat);
    if (cat) {
      setCatName(cat.name);
      setCatIcon(cat.icon || '🏪');
    } else {
      setCatName('');
      setCatIcon('🏪');
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      notify('warning', 'Category name is required.');
      return;
    }
    try {
      if (currentCat) {
        const res = await adminAPI.updateCategory(currentCat._id, {
          name: catName.trim(),
          icon: catIcon,
          isActive: currentCat.isActive,
        });
        if (res.success) {
          notify('success', 'Category updated successfully.');
          fetchCategories();
          setIsCatModalOpen(false);
        }
      } else {
        const res = await adminAPI.createCategory({
          name: catName.trim(),
          icon: catIcon,
        });
        if (res.success) {
          notify('success', 'Category created successfully.');
          fetchCategories();
          setIsCatModalOpen(false);
        }
      }
    } catch (err) {
      notify('error', err.message || 'Error saving category.');
    }
  };

  const handleToggleCatActive = async (cat) => {
    try {
      const res = await adminAPI.updateCategory(cat._id, {
        name: cat.name,
        icon: cat.icon,
        isActive: !cat.isActive,
      });
      if (res.success) {
        notify('success', `Category is now ${!cat.isActive ? 'active' : 'inactive'}.`);
        fetchCategories();
      }
    } catch (err) {
      notify('error', 'Failed to update category status.');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category may become uncategorized.')) return;
    try {
      const res = await adminAPI.deleteCategory(id);
      if (res.success) {
        notify('success', 'Category deleted successfully.');
        fetchCategories();
      }
    } catch (err) {
      notify('error', 'Failed to delete category.');
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await adminAPI.getAllReviews();
      if (res.success) setReviews(res.reviews || []);
    } catch (err) {
      notify('error', 'Failed to retrieve reviews.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const res = await adminAPI.deleteReview(id);
      if (res.success) {
        notify('success', 'Review deleted successfully.');
        fetchReviews();
      }
    } catch (err) {
      notify('error', 'Failed to delete review.');
    }
  };

  const fetchFraudAlerts = async () => {
    setLoadingFraud(true);
    try {
      const res = await adminAPI.getFraudAlerts();
      if (res.success) setFraudAlerts(res.alerts || []);
    } catch (err) {
      notify('error', 'Failed to retrieve fraud warnings.');
    } finally {
      setLoadingFraud(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await adminAPI.getAuditLogs();
      if (res.success) setAuditLogs(res.logs || []);
    } catch (err) {
      notify('error', 'Failed to retrieve system logs.');
    } finally {
      setLoadingAudit(false);
    }
  };

  if (loadingData || !adminStats) {
    return <AdminDashboardSkeleton />;
  }

  const { stats, recentActivities, recentShops } = adminStats;

  const total = stats.totalShops;
  const pending = stats.pendingShops;
  const approved = stats.approvedShops;
  const rejected = stats.rejectedShops;
  const totalProducts = stats.totalProducts;
  const totalOrders = stats.totalOrders;
  const completedOrders = stats.completedOrdersCount;
  const estimatedRevenue = stats.estimatedRevenue;

  // Donut chart stroke settings
  const circleRadius = 50;
  const circumference = 2 * Math.PI * circleRadius; // 314.16
  const approvedPercent = total > 0 ? (approved / total) : 0;
  const pendingPercent = total > 0 ? (pending / total) : 0;
  const rejectedPercent = total > 0 ? (rejected / total) : 0;

  const approvedDash = approvedPercent * circumference;
  const pendingDash = pendingPercent * circumference;
  const rejectedDash = rejectedPercent * circumference;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h1>
          <p className="text-slate-450 text-xs font-semibold mt-0.5">Platform management and moderation dashboard</p>
        </div>
        {pending > 0 && (
          <Link
            to="/admin/stores"
            className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl hover:bg-amber-100/50 transition-all self-start shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{pending} application{pending !== 1 ? 's' : ''} pending review</span>
            <span className="text-amber-600">→</span>
          </Link>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto pb-0.5 scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: '🏠' },
          { id: 'categories', label: 'Category CRUD', icon: '🗂️' },
          { id: 'reviews', label: 'Reviews Moderation', icon: '💬' },
          { id: 'fraud', label: 'Fraud Alerts', icon: '⚠️' },
          { id: 'audit', label: 'Audit Logs', icon: '📜' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 pb-4 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.id === 'fraud' && fraudAlerts.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-sm">
                {fraudAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard label="Total Shops" value={total} icon="🏪" colorClass="text-violet-650" glowBgClass="bg-violet-500" />
            <KPICard label="Pending Approval" value={pending} icon="⏳" colorClass="text-amber-700" glowBgClass="bg-amber-500" />
            <KPICard label="Approved" value={approved} icon="✅" colorClass="text-emerald-700" glowBgClass="bg-emerald-500" />
            <KPICard label="Rejected" value={rejected} icon="❌" colorClass="text-rose-600" glowBgClass="bg-rose-500" />
            <KPICard label="Products" value={totalProducts} icon="📦" colorClass="text-blue-600" glowBgClass="bg-blue-500" />
            <KPICard label="Completed / Orders" value={`${completedOrders}/${totalOrders}`} icon="🎟️" colorClass="text-cyan-600" glowBgClass="bg-cyan-500" />
          </div>

          {/* Revenue highlight */}
          <div className="card p-6 border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">Platform GMV (Gross Merchandise Value)</p>
                <p className="text-3xl font-black text-slate-800">₹{estimatedRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-450 font-medium mt-1">Total value of all orders placed on the platform</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-emerald-700">{completedOrders}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-amber-700">{totalOrders - completedOrders}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active/In Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line & Donut Chart Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sales Growth Curve */}
            <div className="lg:col-span-2 card p-6 border-slate-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Platform Sales Curve</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Order activity overview</p>
                </div>
                <span className="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Weekly GMV</span>
              </div>

              <div className="relative w-full h-44">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f8fafc" strokeWidth="1" />

                  {/* Area */}
                  <path
                    d="M 10 130 C 80 115, 140 30, 200 80 C 260 130, 320 50, 380 90 C 440 130, 480 30, 490 60 L 490 140 L 10 140 Z"
                    fill="url(#salesGrad)"
                  />

                  {/* Curve */}
                  <path
                    d="M 10 130 C 80 115, 140 30, 200 80 C 260 130, 320 50, 380 90 C 440 130, 480 30, 490 60"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <circle cx="200" cy="80" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="380" cy="90" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Shop Status Donut Chart */}
            <div className="card p-6 border-slate-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Shop Verification Mix</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Approved vs pending stores</p>
              </div>

              <div className="flex justify-center items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={circleRadius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    
                    {total > 0 ? (
                      <>
                        {/* Approved */}
                        <circle
                          cx="60"
                          cy="60"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeDasharray={`${approvedDash} ${circumference}`}
                          strokeDashoffset={0}
                        />
                        {/* Pending */}
                        <circle
                          cx="60"
                          cy="60"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#f59e0b"
                          strokeWidth="12"
                          strokeDasharray={`${pendingDash} ${circumference}`}
                          strokeDashoffset={-approvedDash}
                        />
                        {/* Rejected */}
                        <circle
                          cx="60"
                          cy="60"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#ef4444"
                          strokeWidth="12"
                          strokeDasharray={`${rejectedDash} ${circumference}`}
                          strokeDashoffset={-(approvedDash + pendingDash)}
                        />
                      </>
                    ) : null}
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
                    <span className="text-base font-extrabold text-slate-800">{total}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Stores</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Approved ({approved})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pending ({pending})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Rejected ({rejected})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Recent registrations + Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent registrations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">🏪 Recent Registrations</h2>
                <Link to="/admin/stores" className="text-xs text-amber-650 hover:text-amber-700 font-bold uppercase tracking-wider">View all →</Link>
              </div>
              <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
                {recentShops.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No registrations yet</div>
                ) : (
                  recentShops.map((shop) => (
                    <div key={shop._id} className="flex items-center justify-between px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-sm">🏪</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{shop.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 font-medium">{shop.address?.city || 'India'} · {formatDate(shop.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant={shop.approvalStatus} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity log */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">📜 Platform Audit Snapshot</h2>
              <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
                {recentActivities.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No activity recorded yet</div>
                ) : (
                  recentActivities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <p className={`flex-1 text-xs font-semibold ${item.color?.replace('text-cyan-400', 'text-blue-600')?.replace('text-violet-400', 'text-violet-600')?.replace('text-amber-400', 'text-amber-700')} min-w-0`}>{item.text}</p>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORY CRUD TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Product Categories</h2>
              <p className="text-xs text-slate-450 mt-1 font-semibold">Configure active business categories offered on the platform.</p>
            </div>
            <Button variant="success" icon="➕" onClick={() => handleOpenCatModal()} className="shadow-sm font-bold text-xs py-2">
              Add Category
            </Button>
          </div>

          <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase font-black tracking-wider text-[10px]">
                    <th className="px-5 py-4">Icon</th>
                    <th className="px-5 py-4">Category Name</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCats ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 animate-pulse font-semibold">
                        Loading categories...
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                        No categories found. Click "Add Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 text-2xl w-16">{cat.icon || '🏪'}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-800">{cat.name}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleCatActive(cat)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black border transition-colors ${
                              cat.isActive
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <Button variant="secondary" size="xs" onClick={() => handleOpenCatModal(cat)} className="shadow-sm font-bold">
                            ✏️ Edit
                          </Button>
                          <Button variant="danger" size="xs" onClick={() => handleDeleteCat(cat._id)} className="shadow-sm font-bold">
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. REVIEW MODERATION TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Review Moderation</h2>
            <p className="text-xs text-slate-450 mt-1 font-semibold">Audit and moderate buyer reviews submitted for stores.</p>
          </div>

          <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase font-black tracking-wider text-[10px]">
                    <th className="px-5 py-4">Submitted By</th>
                    <th className="px-5 py-4">Store</th>
                    <th className="px-5 py-4 text-center">Rating</th>
                    <th className="px-5 py-4">Comment</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingReviews ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 animate-pulse font-semibold">
                        Loading reviews...
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                        No reviews submitted yet.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{r.buyerId?.name || 'Deleted User'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{r.buyerId?.email || ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-700">{r.shopId?.name || 'Deleted Store'}</p>
                          <span className="text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{r.shopId?.category || ''}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-amber-600">★ {r.rating}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 max-w-xs truncate" title={r.comment}>
                          {r.comment || <span className="italic text-slate-400">No comment left</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button variant="danger" size="xs" onClick={() => handleDeleteReview(r._id)} className="shadow-sm font-bold">
                            🗑️ Delete Review
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. FRAUD ALERTS TAB */}
      {activeTab === 'fraud' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Fraud & Abuse Monitor</h2>
            <p className="text-xs text-slate-450 mt-1 font-semibold">Identifies users with anomalous levels of cancellations or suspicious activities.</p>
          </div>

          <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase font-black tracking-wider text-[10px]">
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4 text-center">Total Bookings</th>
                    <th className="px-5 py-4 text-center">Cancellations</th>
                    <th className="px-5 py-4 text-center">Cancellation Rate</th>
                    <th className="px-5 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingFraud ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 animate-pulse font-semibold">
                        Analyzing activities...
                      </td>
                    </tr>
                  ) : fraudAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 py-4">
                          <span className="text-3xl">🛡️</span>
                          <p className="text-emerald-700 font-bold">No suspicious accounts flagged.</p>
                          <p className="text-[10px] text-slate-400 font-semibold">All customer booking logs fall within safety thresholds.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fraudAlerts.map((alert, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors border-l-2 border-l-rose-500">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{alert.buyer?.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{alert.buyer?.email} · {alert.buyer?.phone}</p>
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700 font-mono font-bold">{alert.totalOrders}</td>
                        <td className="px-5 py-4 text-center text-rose-600 font-mono font-bold">{alert.cancelledOrders}</td>
                        <td className="px-5 py-4 text-center text-rose-600 font-bold font-mono">
                          {alert.cancellationRate}%
                        </td>
                        <td className="px-5 py-4 text-right text-rose-600 font-bold">
                          {alert.reason}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">System Audit Logs</h2>
            <p className="text-xs text-slate-450 mt-1 font-semibold">Immutable tracker recording administrative and critical database actions.</p>
          </div>

          <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase font-black tracking-wider text-[10px]">
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4">Triggered By</th>
                    <th className="px-5 py-4 text-center">Role</th>
                    <th className="px-5 py-4 text-center">Action</th>
                    <th className="px-5 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 animate-pulse font-semibold">
                        Retrieving logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                        No logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      let roleClass = 'bg-slate-100 text-slate-500';
                      if (log.userRole === 'admin') roleClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                      if (log.userRole === 'shopkeeper') roleClass = 'bg-violet-50 text-violet-700 border border-violet-100';
                      
                      return (
                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-slate-400 font-mono font-medium">
                            {new Date(log.timestamp).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {log.userId?.name || 'System / Guest'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${roleClass}`}>
                              {log.userRole || 'Guest'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-slate-600 font-medium">
                            {log.details}
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
      )}

      {/* Category CRUD Modal */}
      <Modal 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)} 
        title={currentCat ? '📝 Edit Category' : '➕ Create New Category'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label-base text-slate-550 text-xs font-semibold mb-1.5 block">Category Name</label>
            <input 
              type="text" 
              value={catName} 
              onChange={(e) => setCatName(e.target.value)} 
              placeholder="e.g. Organic Produce, Pet Care..."
              className="input-base text-sm"
            />
          </div>
          <div>
            <label className="label-base text-slate-550 text-xs font-semibold mb-1.5 block">Category Icon (Emoji)</label>
            <input 
              type="text" 
              value={catIcon} 
              onChange={(e) => setCatIcon(e.target.value)} 
              placeholder="e.g. 🥦, 🐶, 🍞"
              className="input-base text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsCatModalOpen(false)} className="flex-1 font-bold">Cancel</Button>
            <Button variant="success" onClick={handleSaveCategory} className="flex-1 font-bold">Save Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
