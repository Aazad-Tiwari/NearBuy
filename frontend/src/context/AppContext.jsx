import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI, shopkeeperAPI, buyerAPI } from '../services/api';
import { useAuth } from './AuthContext';

// =============================================================================
// CONTEXT
// =============================================================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();

  // ── States ──────────────────────────────────────────────────────────────────
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [shopkeeperOrders, setShopkeeperOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [userLocation, setUserLocation] = useState({ name: 'Koramangala, Bangalore', lat: 12.9348, lng: 77.6245 });
  const [locationReady, setLocationReady] = useState(false);

  // ── Auto Geolocation Detection ──────────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({
            name: 'Current Location',
            lat: latitude,
            lng: longitude
          });
          setLocationReady(true);
        },
        (error) => {
          console.warn('Geolocation permission denied or error. Defaulting to Koramangala.', error);
          setLocationReady(true); // Use default location
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setLocationReady(true);
    }
  }, []);

  // ── Notification / Toast Helper ─────────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]); // max 5 toasts
    setTimeout(() => dismissToast(id), 4500);
  }, [dismissToast]);

  // ── Refresh Admin Stats Callback ───────────────────────────────────────────
  const refreshAdminStats = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await adminAPI.getStats();
      if (res.success) {
        setAdminStats(res);
      }
    } catch (err) {
      console.error('Error refreshing admin stats:', err);
    }
  }, [user]);

  // ── Dynamic Data Loading ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setShops([]);
        setProducts([]);
        setBuyerOrders([]);
        setShopkeeperOrders([]);
        setAdminStats(null);
        return;
      }
      // For buyer role, wait until geolocation has settled to avoid double-fetching
      if (user.role === 'buyer' && !locationReady) return;
      setLoadingData(true);
      try {
        if (user.role === 'admin') {
          const [shopRes, statsRes] = await Promise.all([
            adminAPI.getShops(),
            adminAPI.getStats()
          ]);
          if (shopRes.success) setShops(shopRes.shops);
          if (statsRes.success) setAdminStats(statsRes);
        } else if (user.role === 'shopkeeper') {
          // Get shop
          try {
            const res = await shopkeeperAPI.getMyShop();
            if (res.success && res.shop) {
              setShops([res.shop]);
            }
          } catch (err) {
            // 404 indicates no store registered yet
            if (err.status === 404) {
              setShops([]);
            } else {
              console.error('Error fetching shop:', err);
            }
          }
          // Get products
          try {
            const res = await shopkeeperAPI.getProducts();
            if (res.success) setProducts(res.products);
          } catch (err) {
            console.error('Error fetching products:', err);
          }
          // Get orders
          try {
            const res = await shopkeeperAPI.getOrders();
            if (res.success) setShopkeeperOrders(res.orders);
          } catch (err) {
            console.error('Error fetching incoming orders:', err);
          }
        } else if (user.role === 'buyer') {
          // Fetch orders (tickets)
          try {
            const res = await buyerAPI.getOrders();
            if (res.success) setBuyerOrders(res.orders);
          } catch (err) {
            console.error('Error fetching buyer orders:', err);
          }
          // Prefetch all approved shops/products initially for discover page
          try {
            const shopRes = await buyerAPI.search({ type: 'stores', q: '', lat: userLocation.lat, lng: userLocation.lng });
            if (shopRes.success) setShops(shopRes.results);
            const prodRes = await buyerAPI.search({ type: 'products', q: '', lat: userLocation.lat, lng: userLocation.lng });
            if (prodRes.success) setProducts(prodRes.results);
          } catch (err) {
            console.error('Error prefetching buyer discovery data:', err);
          }
        }
      } catch (err) {
        console.error('Error loading context data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [user, userLocation, locationReady]);

  // ── Dispatchers / Actions ────────────────────────────────────────────────────

  const updateShopStatus = useCallback(async (shopId, status, rejectionReason = '') => {
    try {
      const res = await adminAPI.updateShopStatus(shopId, { status, rejectionReason });
      if (res.success && res.shop) {
        setShops((prev) =>
          prev.map((s) =>
            s._id === shopId ? { ...s, approvalStatus: status, rejectionReason } : s
          )
        );
        notify(status === 'approved' ? 'success' : 'error', `Shop has been ${status}.`);
        refreshAdminStats();
      }
    } catch (err) {
      notify('error', err.message || 'Failed to update shop status.');
    }
  }, [notify, refreshAdminStats]);

  const addProduct = useCallback(async (productData) => {
    try {
      const res = await shopkeeperAPI.addProduct(productData);
      if (res.success && res.product) {
        setProducts((prev) => [res.product, ...prev]);
        notify('success', 'Product added to catalogue.');
      }
    } catch (err) {
      notify('error', err.message || 'Failed to add product.');
    }
  }, [notify]);

  const updateProduct = useCallback(async (productData) => {
    try {
      const res = await shopkeeperAPI.updateProduct(productData._id, productData);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productData._id ? res.product : p))
        );
        notify('success', 'Product updated.');
      }
    } catch (err) {
      notify('error', err.message || 'Failed to update product.');
    }
  }, [notify]);

  const deleteProduct = useCallback(async (productId) => {
    try {
      const res = await shopkeeperAPI.deleteProduct(productId);
      if (res.success) {
        setProducts((prev) =>
          prev.filter((p) => p._id !== productId)
        );
        notify('info', 'Product removed from catalogue.');
      }
    } catch (err) {
      notify('error', err.message || 'Failed to delete product.');
    }
  }, [notify]);

  const updateShopkeeperOrder = useCallback(async (updatedOrder) => {
    try {
      const payload = {
        status: updatedOrder.status,
        verificationCode: updatedOrder.verificationCode,
      };
      const res = await shopkeeperAPI.updateOrderStatus(updatedOrder._id, payload);
      if (res.success && res.order) {
        const updatedWithBuyer = { ...res.order, buyerId: updatedOrder.buyerId };
        setShopkeeperOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedWithBuyer : o))
        );
        notify('success', `Order status updated to "${updatedOrder.status}".`);
      }
    } catch (err) {
      notify('error', err.message || 'Failed to update order status.');
    }
  }, [notify]);

  const addBuyerOrder = useCallback(async (orderData) => {
    try {
      const res = await buyerAPI.placeOrder(orderData);
      if (res.success && res.order) {
        setBuyerOrders((prev) => [res.order, ...prev]);
        notify('success', `Order placed! Your PIN is ${res.order.verificationCode}`);
        return res.order;
      }
    } catch (err) {
      notify('error', err.message || 'Failed to place order.');
      throw err;
    }
  }, [notify]);

  const cancelBuyerOrder = useCallback(async (orderId) => {
    try {
      const res = await buyerAPI.cancelOrder(orderId);
      if (res.success && res.order) {
        setBuyerOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...res.order, shopId: o.shopId } : o))
        );
        notify('info', 'Order cancelled successfully.');
        return res.order;
      }
    } catch (err) {
      notify('error', err.message || 'Failed to cancel order.');
      throw err;
    }
  }, [notify]);

  const addShop = useCallback(async (shopData) => {
    try {
      const res = await shopkeeperAPI.registerShop(shopData);
      if (res.success && res.shop) {
        setShops([res.shop]);
        notify('success', 'Shop application submitted for admin review.');
      }
    } catch (err) {
      notify('error', err.message || 'Failed to register shop.');
    }
  }, [notify]);

  const updateMyShop = useCallback(async (shopData) => {
    try {
      const res = await shopkeeperAPI.updateMyShop(shopData);
      if (res.success && res.shop) {
        setShops([res.shop]);
        notify('success', 'Store profile updated successfully.');
        return res;
      }
    } catch (err) {
      notify('error', err.message || 'Failed to update store details.');
      throw err;
    }
  }, [notify]);

  // ── Selectors ────────────────────────────────────────────────────────────────
  const pendingShops = shops.filter((s) => s.approvalStatus === 'pending');
  const approvedShops = shops.filter((s) => s.approvalStatus === 'approved');
  const rejectedShops = shops.filter((s) => s.approvalStatus === 'rejected');

  const value = {
    shops,
    products,
    buyerOrders,
    shopkeeperOrders,
    adminStats,
    toasts,
    dismissToast,
    loadingData,
    pendingShops,
    approvedShops,
    rejectedShops,
    userLocation,
    // Actions
    updateShopStatus,
    updateMyShop,
    addProduct,
    updateProduct,
    deleteProduct,
    updateShopkeeperOrder,
    addBuyerOrder,
    cancelBuyerOrder,
    addShop,
    refreshAdminStats,
    notify,
    setUserLocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * useApp — consume application context
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within <AppProvider>');
  return context;
}

export default AppContext;
