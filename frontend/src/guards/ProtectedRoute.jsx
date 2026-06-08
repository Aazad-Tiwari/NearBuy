import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a route tree behind auth + optional role check.
 *
 * Usage:
 *   <Route element={<ProtectedRoute role="admin" />}>
 *     <Route path="/admin" element={<AdminLayout />}>...</Route>
 *   </Route>
 *
 * Behaviour:
 *   - While loading → show spinner
 *   - Not authenticated → redirect to /login
 *   - Wrong role → redirect to /{user.role} (their own dashboard)
 *   - OK → render <Outlet />
 */
export default function ProtectedRoute({ role }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse-ring">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl shadow-glow">
            🏬
          </div>
          <p className="text-slate-400 text-sm tracking-wide">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role && user?.role !== role) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return <Outlet />;
}
