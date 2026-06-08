import React from 'react';

/**
 * KPICard — dashboard metric card
 */
export default function KPICard({ label, value, icon, trend, trendLabel, colorClass = 'text-violet-400', bgClass = 'bg-violet-600/10', borderClass = 'border-violet-500/20' }) {
  return (
    <div className={`card border ${borderClass} p-5 flex items-start gap-4 animate-fade-in`}>
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-extrabold ${colorClass} leading-tight`}>{value}</p>
        {(trend !== undefined || trendLabel) && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {trend !== undefined && (
              <span className={trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '–'} {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span>{trendLabel}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
