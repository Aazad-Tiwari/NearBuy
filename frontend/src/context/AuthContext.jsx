import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, storeAuthToken, clearAuthToken } from '../services/api';

const TOKEN_KEY = 'bopis_token';
const USER_KEY = 'bopis_auth_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const t = localStorage.getItem(TOKEN_KEY);
        const u = localStorage.getItem(USER_KEY);
        if (t && u) {
          // Verify token with backend
          const response = await authAPI.getProfile();
          if (response.success && response.user) {
            setToken(t);
            setUser(response.user);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          } else {
            throw new Error('Invalid profile');
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        clearAuthToken();
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  /** Persists auth state to localStorage and React state */
  const _persist = useCallback((newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    storeAuthToken(newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  /**
   * login — validates credentials against backend
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.token && response.user) {
        _persist(response.user, response.token);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message || 'Login failed.' };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid email or password.' };
    }
  }, [_persist]);

  /**
   * register — creates a new user via backend
   */
  const register = useCallback(async ({ name, email, password, role, phone }) => {
    try {
      const response = await authAPI.register({ name, email, password, role, phone });
      if (response.success && response.token && response.user) {
        _persist(response.user, response.token);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message || 'Registration failed.' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  }, [_persist]);

  /** logout — clears auth state and storage */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuthToken();
    localStorage.removeItem(USER_KEY);
  }, []);

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth — consume the auth context */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
