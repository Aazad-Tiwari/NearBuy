// =============================================================================
// API Service Layer — Wraps all backend endpoints
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to convert relative local image URLs to absolute URLs pointing to the backend
 */
export const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (BASE_URL.startsWith('http')) {
    const origin = BASE_URL.replace(/\/api$/, '');
    return `${origin}${url}`;
  }
  return url;
};

/**
 * Recursively scans an object/array and resolves any 'imageUrl' properties
 */
const processImageUrls = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(processImageUrls);
  }
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === 'imageUrl' && typeof obj[key] === 'string') {
        newObj[key] = getFullImageUrl(obj[key]);
      } else {
        newObj[key] = processImageUrls(obj[key]);
      }
    }
  }
  return newObj;
};

/**
 * Retrieves stored auth token from localStorage
 */
const getToken = () => localStorage.getItem('bopis_token');

/**
 * Core fetch wrapper with auth headers and error handling
 */
const request = async (method, endpoint, body = null, requiresAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body && method !== 'GET') config.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return processImageUrls(data);
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (payload) => request('POST', '/auth/register', payload, false),
  login: (payload) => request('POST', '/auth/login', payload, false),
  getProfile: () => request('GET', '/auth/me'),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('GET', '/admin/stats'),
  getShops: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/admin/shops${query ? `?${query}` : ''}`);
  },
  updateShopStatus: (shopId, payload) => request('PATCH', `/admin/shops/${shopId}/status`, payload),
  getUsers: () => request('GET', '/admin/users'),
  toggleUserActive: (userId) => request('PATCH', `/admin/users/${userId}/toggle-active`),
  getAnalytics: () => request('GET', '/admin/analytics'),
  getCategories: () => request('GET', '/admin/categories'),
  createCategory: (payload) => request('POST', '/admin/categories', payload),
  updateCategory: (catId, payload) => request('PATCH', `/admin/categories/${catId}`, payload),
  deleteCategory: (catId) => request('DELETE', `/admin/categories/${catId}`),
  getAllReviews: () => request('GET', '/admin/reviews'),
  deleteReview: (reviewId) => request('DELETE', `/admin/reviews/${reviewId}`),
  getFraudAlerts: () => request('GET', '/admin/fraud'),
  getAuditLogs: () => request('GET', '/admin/audit-logs'),
};

// ── Shopkeeper API ────────────────────────────────────────────────────────────
export const shopkeeperAPI = {
  registerShop: (payload) => request('POST', '/shopkeeper/shops', payload),
  getMyShop: () => request('GET', '/shopkeeper/shops/me'),
  updateMyShop: (payload) => request('PATCH', '/shopkeeper/shops/me', payload),
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/shopkeeper/products${query ? `?${query}` : ''}`);
  },
  addProduct: (payload) => request('POST', '/shopkeeper/products', payload),
  updateProduct: (productId, payload) => request('PATCH', `/shopkeeper/products/${productId}`, payload),
  deleteProduct: (productId) => request('DELETE', `/shopkeeper/products/${productId}`),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/shopkeeper/orders${query ? `?${query}` : ''}`);
  },
  updateOrderStatus: (orderId, payload) => request('PATCH', `/shopkeeper/orders/${orderId}/status`, payload),
  getAnalytics: () => request('GET', '/shopkeeper/analytics'),
  getInventoryHistory: () => request('GET', '/shopkeeper/inventory/history'),
};

// ── Buyer API ─────────────────────────────────────────────────────────────────
export const buyerAPI = {
  search: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/buyer/search?${query}`);
  },
  getRecommendations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/buyer/recommendations${query ? `?${query}` : ''}`);
  },
  getShopDetails: (shopId) => request('GET', `/buyer/shops/${shopId}`),
  placeOrder: (payload) => request('POST', '/buyer/orders', payload),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/buyer/orders${query ? `?${query}` : ''}`);
  },
  comparePrices: (productId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/buyer/products/${productId}/compare${query ? `?${query}` : ''}`);
  },
  optimizeShoppingList: (payload) => request('POST', '/buyer/shopping-list/optimize', payload),
  cancelOrder: (orderId) => request('POST', `/buyer/orders/${orderId}/cancel`),
  submitReview: (orderId, payload) => request('POST', `/buyer/orders/${orderId}/review`, payload),
  getOrderReview: (orderId) => request('GET', `/buyer/orders/${orderId}/reviews`),
  toggleFavorite: (shopId) => request('POST', '/buyer/favorites/toggle', { shopId }),
  getFavorites: () => request('GET', '/buyer/favorites'),
  getNotifications: () => request('GET', '/notifications'),
  markNotificationRead: (notificationId) => request('PATCH', `/notifications/${notificationId}/read`),
  reorderOrder: (orderId) => request('POST', `/buyer/orders/${orderId}/reorder`),
};

// ── Public API ────────────────────────────────────────────────────────────────
export const publicAPI = {
  getStats: () => request('GET', '/public/stats', null, false),
};

// ── Auth Helpers ──────────────────────────────────────────────────────────────
export const storeAuthToken = (token) => localStorage.setItem('bopis_token', token);
export const clearAuthToken = () => localStorage.removeItem('bopis_token');
export const isAuthenticated = () => !!getToken();
