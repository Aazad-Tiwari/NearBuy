import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
      {/* Glowing 404 */}
      <div className="relative mb-8">
        <p className="text-[10rem] font-black text-slate-800 leading-none select-none">404</p>
        <p className="absolute inset-0 flex items-center justify-center text-[10rem] font-black bg-gradient-to-br from-violet-400 to-indigo-400 bg-clip-text text-transparent leading-none blur-sm opacity-40 select-none">404</p>
        <p className="absolute inset-0 flex items-center justify-center text-[10rem] font-black bg-gradient-to-br from-violet-400 to-indigo-400 bg-clip-text text-transparent leading-none select-none">404</p>
      </div>

      <h1 className="text-2xl font-bold text-slate-100 mb-3">Page not found</h1>
      <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-primary px-6 py-2.5">Go Home</Link>
        <Link to="/login" className="btn-secondary px-6 py-2.5">Log In</Link>
      </div>
    </div>
  );
}
