import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — guards routes based on auth state and optional role list.
 *
 * - During bootstrap (loading=true), shows a spinner rather than redirecting
 *   so users with valid refresh cookies don't get kicked to /login
 * - After bootstrap, checks user object (in-memory, not localStorage)
 * - If roles prop is provided, checks hasRole against the normalized role list
 *   (which includes DIRECTOR alias for any legacy 'hod'/'department_head' checks)
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading, canAccess } = useAuth();
  const location = useLocation();

  // Still bootstrapping — show nothing until we know if user is logged in
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-page, #0f172a)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles?.length && !canAccess(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
