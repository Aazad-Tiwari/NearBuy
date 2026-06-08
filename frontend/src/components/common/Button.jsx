import React from 'react';

/**
 * Button — unified button component
 * variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
const VARIANT_CLASSES = {
  primary:   'bg-violet-600 hover:bg-violet-500 text-white border-transparent shadow-glow',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600/60',
  danger:    'bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-500/30 hover:border-rose-500',
  success:   'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30 hover:border-emerald-500',
  ghost:     'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-100 border-transparent',
  info:      'bg-sky-600/15 hover:bg-sky-600 text-sky-400 hover:text-white border-sky-500/30 hover:border-sky-500',
  warning:   'bg-amber-600/15 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-500/30 hover:border-amber-500',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon = null,
}) {
  const baseClasses = `inline-flex items-center justify-center gap-2 font-semibold border transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-base">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
