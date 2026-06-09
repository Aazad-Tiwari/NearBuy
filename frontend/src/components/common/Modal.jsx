import React, { useEffect, useCallback } from 'react';

/**
 * Modal — accessible overlay dialog
 * Props: isOpen, onClose, title, children, size ('sm' | 'md' | 'lg' | 'xl')
 */
const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', hideClose = false }) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 modal-backdrop animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} bg-white border border-slate-200 rounded-2xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg font-extrabold text-slate-800">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-1 font-bold">{subtitle}</p>}
          </div>
          {!hideClose && (
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700">{children}</div>
      </div>
    </div>
  );
}
