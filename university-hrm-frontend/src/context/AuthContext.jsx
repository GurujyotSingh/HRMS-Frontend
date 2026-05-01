import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { authAPI, setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext(null);

/**
 * Normalize NestJS user shape to the internal user object.
 * NestJS returns: { id, employeeId, email, role, firstName, lastName, profilePhoto, department }
 * Role is a SystemRole enum string: SUPER_ADMIN | DIRECTOR | HR_MANAGER | HR_STAFF | FACULTY | STAFF
 *
 * Internal shape kept backward-compatible with existing pages:
 *   user.role.name  → lowercased canonical role string
 *   user.first_name / user.last_name → for existing templates
 */
function normalizeUser(raw) {
  if (!raw) return null;

  // NestJS SystemRole → internal role name mapping
  const ROLE_MAP = {
    SUPER_ADMIN:  'admin',
    HR_MANAGER:   'hr',
    HR_STAFF:     'hr_staff',
    DIRECTOR:     'director',      // ← replaces all HOD/department_head references
    FACULTY:      'faculty',
    STAFF:        'staff',
  };

  const rawRole = typeof raw.role === 'string' ? raw.role : raw.role?.name ?? '';
  const roleName = ROLE_MAP[rawRole] || rawRole.toLowerCase();

  return {
    id:           raw.id,
    employeeId:   raw.employeeId,
    email:        raw.email,
    workEmail:    raw.workEmail,
    // Backward compat fields
    first_name:   raw.firstName || raw.first_name || '',
    last_name:    raw.lastName  || raw.last_name  || '',
    firstName:    raw.firstName || raw.first_name || '',
    lastName:     raw.lastName  || raw.last_name  || '',
    profilePhoto: raw.profilePhoto || null,
    department:   raw.department || null,
    departmentId: raw.departmentId || null,
    designation:  raw.designation || null,
    // Role as object for backward compat with hasRole() checks
    role:         { name: roleName, raw: rawRole },
  };
}

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
        const newToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          const { data: me } = await authAPI.me();
          if (!cancelled) setUser(normalizeUser(me));
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
      // NestJS returns: { success, data: { accessToken, user } }
      const res = await authAPI.login(email, password, rememberMe);
      const payload = res.data?.data || res.data;
      const token = payload?.accessToken;
      const userData = payload?.user;

      if (!token) throw new Error('No access token received');

      setAccessToken(token);
      const normalized = normalizeUser(userData);
      setUser(normalized);
      return { ok: true };
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.response?.data?.detail ||
        e.message ||
        'Login failed';
      setAuthError(String(msg));
      return { ok: false, error: String(msg) };
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
      const current = user?.role?.name;
      if (!current) return false;

      // HOD alias map — any legacy role string maps to its DIRECTOR equivalent
      const HOD_ALIASES = ['hod', 'department_head', 'head_of_department'];

      return roles.some((r) => {
        const normalized = HOD_ALIASES.includes(r.toLowerCase()) ? 'director' : r.toLowerCase();
        return current === normalized;
      });
    },
    [user]
  );

  // ─── Can access check (broader — admin can always access hr routes etc.) ─
  const canAccess = useCallback(
    (...roles) => {
      if (!user) return false;
      const role = user.role?.name;
      // Admin can access everything
      if (role === 'admin') return true;
      return hasRole(...roles);
    },
    [user, hasRole]
  );

  // ─── Refresh user data ──────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data: me } = await authAPI.me();
      setUser(normalizeUser(me));
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
      setUser: (raw) => setUser(raw ? normalizeUser(raw) : null),
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
