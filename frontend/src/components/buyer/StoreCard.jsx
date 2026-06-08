import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StoreCard — displays a store search result
 */
const CATEGORY_ICONS = {
  Electronics: '💻', Clothing: '👗', Grocery: '🥬', Pharmacy: '💊',
  Books: '📚', Sports: '⚽', 'Home & Garden': '🏡', Toys: '🧸',
  'Food & Beverages': '🍽️', Beauty: '💄', Other: '🏪',
};

export default function StoreCard({ shop }) {
  const icon = CATEGORY_ICONS[shop.category] || '🏪';

  const getStatusConfig = () => {
    if (shop.approvalStatus !== 'approved') {
      if (shop.approvalStatus === 'pending') {
        return { label: 'Pending Approval', color: 'text-amber-700 bg-amber-50 border-amber-100' };
      }
      return { label: 'Closed by Platform', color: 'text-rose-600 bg-rose-50 border-rose-100' };
    }
    
    if (shop.isOpen) {
      return { label: 'Open Now', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    }
    return { label: 'Closed Now', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  const status = getStatusConfig();

  return (
    <Link 
      to={`/buyer/shops/${shop._id}`} 
      className="card flex flex-col animate-fade-in overflow-hidden group hover:border-blue-500/25 hover:shadow-md transition-all duration-300 border-slate-200 bg-white shadow-sm"
      id={`store-card-${shop._id}`}
    >
      {/* Top gradient accent */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl" />

      <div className="p-5 flex flex-col gap-3.5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
              {shop.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}>
                <span className={`w-1 h-1 rounded-full ${shop.approvalStatus === 'approved' && shop.isOpen ? 'bg-emerald-500' : shop.approvalStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                {status.label}
              </span>
              {shop.approvalStatus === 'approved' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full">
                  ★ {shop.rating ? shop.rating.toFixed(1) : '0.0'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 h-8">{shop.description}</p>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-2 text-xs border-t border-slate-50 pt-3">
          <div className="flex items-start gap-2 text-slate-500">
            <span className="mt-0.5">📍</span>
            <span className="leading-relaxed">
              {shop.address.street}, {shop.address.city}, {shop.address.state} — {shop.address.zipCode}
            </span>
          </div>
          {shop.phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <span>📞</span>
              <span>{shop.phone}</span>
            </div>
          )}
          {shop.openingHours && (
            <div className="flex items-center gap-2 text-slate-500">
              <span>🕐</span>
              <span>{shop.openingHours}</span>
            </div>
          )}
        </div>

        {/* Category chip */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between mt-auto">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {shop.category}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Since {new Date(shop.createdAt).getFullYear()}
          </span>
        </div>
      </div>
    </Link>
  );
}
