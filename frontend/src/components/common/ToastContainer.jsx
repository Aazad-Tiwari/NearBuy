import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    bar: 'bg-emerald-500',
    icon: '✅',
    title: 'text-emerald-900',
    text: 'text-emerald-700',
  },
  error: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    bar: 'bg-rose-500',
    icon: '❌',
    title: 'text-rose-900',
    text: 'text-rose-700',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    bar: 'bg-amber-500',
    icon: '⚠️',
    title: 'text-amber-900',
    text: 'text-amber-700',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    bar: 'bg-blue-500',
    icon: 'ℹ️',
    title: 'text-blue-900',
    text: 'text-blue-700',
  },
};

function Toast({ id, type, message, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div
      className={`relative overflow-hidden flex items-start gap-3 w-80 p-4 rounded-2xl border shadow-lg transition-all duration-300 ${style.bg} ${style.border} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${style.bar} animate-toast-shrink`}
        style={{ animation: 'toastShrink 4.5s linear forwards' }}
      />

      {/* Icon */}
      <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-relaxed ${style.text}`}>{message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors opacity-60 hover:opacity-100 ${style.text}`}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={dismissToast}
          />
        </div>
      ))}
    </div>
  );
}
