import React from 'react';

/**
 * Badge — status indicator chip
 * variant: 'pending' | 'confirmed' | 'packed' | 'accepted' | 'ready' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'info'
 */
const VARIANT_STYLES = {
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  packed:    'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  accepted:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  ready:     'bg-violet-500/15 text-violet-400 border-violet-500/25',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  approved:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected:  'bg-rose-500/15 text-rose-400 border-rose-500/25',
  modify:    'bg-orange-500/15 text-orange-400 border-orange-500/25',
  info:      'bg-sky-500/15 text-sky-400 border-sky-500/25',
  default:   'bg-slate-700/40 text-slate-400 border-slate-600/30',
};

const STATUS_DOTS = {
  pending:   'bg-amber-400',
  confirmed: 'bg-blue-400',
  packed:    'bg-indigo-400',
  accepted:  'bg-blue-400',
  ready:     'bg-violet-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
  approved:  'bg-emerald-400',
  rejected:  'bg-rose-400',
  modify:    'bg-orange-400',
  info:      'bg-sky-400',
};

const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  packed:    'Packed',
  accepted:  'Accepted',
  ready:     'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved:  'Approved',
  rejected:  'Rejected',
  modify:    'Modification Needed',
};

export default function Badge({ variant = 'default', label, dot = true, className = '' }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const dotColor = STATUS_DOTS[variant];
  const displayLabel = label || STATUS_LABELS[variant] || variant;

  return (
    <span className={`status-badge border ${style} ${className}`}>
      {dot && dotColor && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${variant === 'pending' ? 'animate-pulse' : ''}`} />
      )}
      {displayLabel}
    </span>
  );
}
