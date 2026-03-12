import type {  User } from '../types/auth';

export const PERMISSIONS = {
  // Employee permissions
  VIEW_OWN_PROFILE: 'view_own_profile',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  APPLY_LEAVE: 'apply_leave',
  VIEW_OWN_LEAVES: 'view_own_leaves',
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  VIEW_OWN_PAYSLIPS: 'view_own_payslips',

  // HOD permissions
  VIEW_DEPARTMENT_EMPLOYEES: 'view_department_employees',
  APPROVE_LEAVE: 'approve_leave',
  VIEW_DEPARTMENT_REPORTS: 'view_department_reports',
  CONDUCT_PERFORMANCE_REVIEW: 'conduct_performance_review',

  // HR Admin permissions
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_LEAVE_TYPES: 'manage_leave_types',
  PROCESS_PAYROLL: 'process_payroll',
  VIEW_ALL_REPORTS: 'view_all_reports',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_ROLES: 'manage_roles',
  CONFIGURE_SYSTEM: 'configure_system',

  // Director permissions
  VIEW_UNIVERSITY_REPORTS: 'view_university_reports',
  OVERRIDE_APPROVALS: 'override_approvals',
  VIEW_BUDGET: 'view_budget',
  APPROVE_STRATEGIC_DECISIONS: 'approve_strategic_decisions',

 VIEW_PAYROLL: 'view_payroll',
  // PROCESS_PAYROLL: 'process_payroll',
  VIEW_SALARY_HISTORY: 'view_salary_history',
  EXPORT_FINANCIAL_REPORTS: 'export_financial_reports',
  FLAG_PAYROLL_ISSUES: 'flag_payroll_issues',
  VIEW_TAX_DETAILS: 'view_tax_details',
  GENERATE_TAX_REPORTS: 'generate_tax_reports',
  VIEW_FINANCIAL_DASHBOARD: 'view_financial_dashboard',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const hasPermission = (user: User | null | undefined, permission: string): boolean => {
  // If user is null or undefined, no permissions
  if (!user) return false;

  // Check if user has roles array
  if (!user.roles || !Array.isArray(user.roles)) {
    // Fallback to role string if available
    if (user.role) {
      // Admin/Director have all permissions
      if (user.role === 'HRAdmin' || user.role === 'Director') {
        return true;
      }
      
      // HOD permissions
      if (user.role === 'HOD') {
        const hodPermissions = [
          'view_department_employees',
          'approve_leave',
          'view_department_reports',
          'conduct_performance_review',
        ];
        return hodPermissions.includes(permission);
      }
      
      // Employee permissions
      if (user.role === 'Employee') {
        const employeePermissions = [
          'view_own_profile',
          'edit_own_profile',
          'apply_leave',
          'view_own_leaves',
          'view_own_attendance',
          'view_own_payslips',
        ];
        return employeePermissions.includes(permission);
      }
    }
    return false;
  }

  // Admin/Director have all permissions
  if (user.roles.some(r => r.name === 'HRAdmin' || r.name === 'Director')) {
    return true;
  }

  // Check specific permissions from roles array
  return user.permissions?.some((p: { code: string; }) => p.code === permission) || false;
};

export const hasAnyPermission = (user: User | null | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.some(p => hasPermission(user, p));
};

export const hasAllPermissions = (user: User | null | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.every(p => hasPermission(user, p));
};

export const getRolePermissions = (roleName: string): string[] => {
  switch (roleName) {
    case 'Employee':
      return [
        'view_own_profile',
        'edit_own_profile',
        'apply_leave',
        'view_own_leaves',
        'view_own_attendance',
        'view_own_payslips',
      ];
    case 'HOD':
      return [
        'view_department_employees',
        'approve_leave',
        'view_department_reports',
        'conduct_performance_review',
        ...getRolePermissions('Employee'),
      ];
    case 'HRAdmin':
    case 'Director':
      return Object.values(PERMISSIONS);
    default:
      return [];
  }
};