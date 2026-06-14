import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { authAPI, setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext(null);



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while bootstrapping
  const [authError, setAuthError] = useState(null);

  // ─── Bootstrap: try silent token refresh on mount ──────────────────────
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const refreshRes = await authAPI.refresh();
        const newToken = refreshRes.data?.access_token || refreshRes.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          const { data: me } = await authAPI.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        // No valid refresh cookie — user is logged out, which is fine
        clearAccessToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, rememberMe = false) => {
    setLoading(true);
    setAuthError(null);
    try {
      // API returns: { access_token: "...", token_type: "bearer" }
      const res = await authAPI.login(email, password, rememberMe);
      const payload = res.data?.data || res.data;
      const token = payload?.access_token || payload?.accessToken;

      if (!token) throw new Error('No access token received');

      setAccessToken(token);
      
      // Fetch user profile immediately after login
      const { data: me } = await authAPI.me();
      setUser(me);
      
      return { ok: true };
    } catch (e) {
      const d = e.response?.data || {};
      let msg = 'Login failed';
      if (typeof d.message === 'string') msg = d.message;
      else if (typeof d.detail === 'string') msg = d.detail;
      else if (Array.isArray(d.detail) && d.detail[0]?.msg) msg = d.detail[0].msg;
      else if (typeof d.error === 'string') msg = d.error;
      else if (e.message) msg = e.message;

      setAuthError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors — clear client state regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  // ─── Role check ─────────────────────────────────────────────────────────
  /**
   * hasRole(...roles) checks against the normalized role name.
   * Accepts both new names ('director', 'hr') and legacy ('hod', 'department_head', 'admin').
   *
   * HOD → DIRECTOR alias: any check for 'hod' or 'department_head' is treated as 'director'
   */
  const hasRole = useCallback(
    (...roles) => {
      const current = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
      if (!current) return false;

      // HOD alias map — any legacy role string maps to its DIRECTOR equivalent
      const HOD_ALIASES = ['hod', 'department_head', 'head_of_department'];
      
      // Map super_admin to admin for UI compatibility
      const currentNormalized = current === 'super_admin' ? 'admin' : current;

      return roles.some((r) => {
        const normalized = HOD_ALIASES.includes(r.toLowerCase()) ? 'director' : r.toLowerCase();
        return currentNormalized === normalized;
      });
    },
    [user]
  );

  // ─── Can access check (broader — admin can always access hr routes etc.) ─
  const canAccess = useCallback(
    (...roles) => {
      if (!user) return false;
      const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
      // Admin can access everything
      if (role === 'super_admin' || role === 'admin') return true;
      return hasRole(...roles);
    },
    [user, hasRole]
  );

  // ─── Refresh user data ──────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data: me } = await authAPI.me();
      setUser(me);
    } catch {
      // Token likely expired — logout
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      login,
      logout,
      hasRole,
      canAccess,
      refreshUser,
      setUser: (raw) => setUser(raw),
      isAuthenticated: !!user,
    }),
    [user, loading, authError, login, logout, hasRole, canAccess, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
