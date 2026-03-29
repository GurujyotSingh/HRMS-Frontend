import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authAPI, employeesAPI } from '../services/api';

const AuthContext = createContext(null);

function normalizeUser(raw) {
  if (!raw) return null;
  const roleName =
    typeof raw.role === 'string' ? raw.role : raw.role?.name ?? raw.role_name;
  return {
    email: raw.email,
    role: { name: roleName },
    first_name: raw.first_name,
    last_name: raw.last_name,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('hrm_user');
      return s ? normalizeUser(JSON.parse(s)) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    try {
      const { data: tokenData } = await authAPI.login(email, password);
      localStorage.setItem('hrm_token', tokenData.access_token);

      const { data: me } = await authAPI.me();
      let profile = {};
      try {
        const { data: emp } = await employeesAPI.me();
        profile = {
          first_name: emp.first_name,
          last_name: emp.last_name,
        };
      } catch {
        /* no employee row */
      }

      const full = normalizeUser({ ...me, ...profile });
      localStorage.setItem('hrm_user', JSON.stringify(full));
      setUser(full);
      return { ok: true };
    } catch (e) {
      const msg =
        e.response?.data?.detail ||
        (typeof e.response?.data?.detail === 'object'
          ? JSON.stringify(e.response.data.detail)
          : null) ||
        e.message ||
        'Login failed';
      return { ok: false, error: String(msg) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hrm_token');
    localStorage.removeItem('hrm_user');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      const name = user?.role?.name;
      return roles.includes(name);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      hasRole,
      setUser,
    }),
    [user, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
