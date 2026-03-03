import { useAuth } from './useAuth';

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string | Permission): boolean => {
    if (!user) return false;

    // Admin/Director have all permissions
    if (user.role === 'HRAdmin' || user.role === 'Director') return true;

    // HOD permissions
    if (user.role === 'HOD') {
      const hodPermissions = [
        'view_department_employees',
        'approve_leave',
        'view_department_reports',
        'conduct_performance_review',
      ];
      if (typeof permission === 'string') {
        return hodPermissions.includes(permission);
      }
      // Check specific resource permissions
      return true; // Simplified for demo
    }

    // Employee permissions
    if (user.role === 'Employee') {
      const employeePermissions = [
        'view_own_profile',
        'apply_leave',
        'view_own_attendance',
        'view_own_payslips',
      ];
      if (typeof permission === 'string') {
        return employeePermissions.includes(permission);
      }
      return false;
    }

    return false;
  };

  const hasAnyPermission = (permissions: (string | Permission)[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: (string | Permission)[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.role === 'HRAdmin',
    isDirector: user?.role === 'Director',
    isHOD: user?.role === 'HOD',
    isEmployee: user?.role === 'Employee',
  };
};