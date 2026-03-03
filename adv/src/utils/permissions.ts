import { User } from '../types/auth';

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
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;

  // Admin/Director have all permissions
  if (user.roles.some(r => r.name === 'HRAdmin' || r.name === 'Director')) {
    return true;
  }

  // Check specific permissions
  return user.permissions.some(p => p.code === permission);
};

export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  return permissions.some(p => hasPermission(user, p));
};

export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  return permissions.every(p => hasPermission(user, p));
};

export const getRolePermissions = (roleName: string): Permission[] => {
  switch (roleName) {
    case 'Employee':
      return [
        'VIEW_OWN_PROFILE',
        'EDIT_OWN_PROFILE',
        'APPLY_LEAVE',
        'VIEW_OWN_LEAVES',
        'VIEW_OWN_ATTENDANCE',
        'VIEW_OWN_PAYSLIPS',
      ];
    case 'HOD':
      return [
        'VIEW_DEPARTMENT_EMPLOYEES',
        'APPROVE_LEAVE',
        'VIEW_DEPARTMENT_REPORTS',
        'CONDUCT_PERFORMANCE_REVIEW',
        ...getRolePermissions('Employee'),
      ];
    case 'HRAdmin':
      return Object.values(PERMISSIONS);
    case 'Director':
      return Object.values(PERMISSIONS);
    default:
      return [];
  }
};