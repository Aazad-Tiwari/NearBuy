import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ── Guards & Layouts ──────────────────────────────────────────────────────────
import ProtectedRoute from './guards/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import BuyerLayout from './layouts/BuyerLayout';
import ShopkeeperLayout from './layouts/ShopkeeperLayout';
import AdminLayout from './layouts/AdminLayout';

// ── Public Pages ──────────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// ── Buyer Pages ───────────────────────────────────────────────────────────────
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import MyOrders from './pages/buyer/MyOrders';
import CartPage from './pages/buyer/CartPage';
import ShoppingListOptimizer from './pages/buyer/ShoppingListOptimizer';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import ShopDetailPage from './pages/buyer/ShopDetailPage';
import StoresPage from './pages/buyer/StoresPage';

// ── Shopkeeper Pages ──────────────────────────────────────────────────────────
import ShopkeeperDashboard from './pages/shopkeeper/ShopkeeperDashboard';
import OrdersPage from './pages/shopkeeper/OrdersPage';
import InventoryPage from './pages/shopkeeper/InventoryPage';
import MyStorePage from './pages/shopkeeper/MyStorePage';
import ShopkeeperAnalyticsPage from './pages/shopkeeper/AnalyticsPage';

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreApprovalsPage from './pages/admin/StoreApprovalsPage';
import UsersPage from './pages/admin/UsersPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

/**
 * AuthRedirect — if already logged in and tries to visit /login or /register,
 * redirect them to their dashboard.
 */
function AuthRedirect({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

/**
 * App — root route tree
 */
export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages — redirect if already logged in */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={<AuthRedirect><LoginPage /></AuthRedirect>}
        />
        <Route
          path="/register"
          element={<AuthRedirect><RegisterPage /></AuthRedirect>}
        />
      </Route>

      {/* ── Buyer ─────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute role="buyer" />}>
        <Route element={<BuyerLayout />}>
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/stores" element={<StoresPage />} />
          <Route path="/buyer/tickets" element={<MyOrders />} />
          <Route path="/buyer/cart" element={<CartPage />} />
          <Route path="/buyer/optimize" element={<ShoppingListOptimizer />} />
          <Route path="/buyer/products/:id" element={<ProductDetailPage />} />
          <Route path="/buyer/shops/:id" element={<ShopDetailPage />} />
        </Route>
      </Route>

      {/* ── Shopkeeper ────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute role="shopkeeper" />}>
        <Route element={<ShopkeeperLayout />}>
          <Route path="/shopkeeper" element={<ShopkeeperDashboard />} />
          <Route path="/shopkeeper/orders" element={<OrdersPage />} />
          <Route path="/shopkeeper/inventory" element={<InventoryPage />} />
          <Route path="/shopkeeper/store" element={<MyStorePage />} />
          <Route path="/shopkeeper/analytics" element={<ShopkeeperAnalyticsPage />} />
        </Route>
      </Route>

      {/* ── Admin ─────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stores" element={<StoreApprovalsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      {/* ── Catch-all ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
