import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../common/LoadingSpinner';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermission,
}) => {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => 
      user?.roles?.some(r => r.name === role) || user?.role === role
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user has required permission
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;