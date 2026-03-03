export const ROLES = {
  EMPLOYEE: 'Employee',
  HOD: 'HOD',
  HR_ADMIN: 'HRAdmin',
  DIRECTOR: 'Director',
} as const;

export const LEAVE_TYPES = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  STUDY: 'Study Leave',
  UNPAID: 'Unpaid Leave',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half-Day',
  HOLIDAY: 'Holiday',
  LEAVE: 'Leave',
} as const;

export const PAYROLL_STATUS = {
  PENDING: 'Pending',
  PROCESSED: 'Processed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
} as const;

export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
} as const;

export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export const NOTIFICATION_TYPES = {
  APPROVAL: 'Approval',
  REMINDER: 'Reminder',
  ALERT: 'Alert',
  INFO: 'Info',
} as const;

export const DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Administration',
] as const;

export const ACADEMIC_RANKS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Staff',
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  EMPLOYEES: {
    BASE: '/employees',
    SEARCH: '/employees/search',
    BULK: '/employees/bulk',
    EXPORT: '/employees/export',
  },
  LEAVE: {
    REQUESTS: '/leave-requests',
    TYPES: '/leave-types',
    BALANCE: '/leave-balance',
  },
  ATTENDANCE: {
    BASE: '/attendance',
    CLOCK_IN: '/attendance/clock-in',
    CLOCK_OUT: '/attendance/clock-out',
    REPORT: '/attendance/report',
  },
  PAYROLL: {
    BASE: '/payroll',
    GENERATE: '/payroll/generate',
    TAX: '/tax',
  },
  REPORTS: {
    BASE: '/reports',
    ANALYTICS: '/reports/analytics',
    EXPORT: '/reports/export',
  },
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY, hh:mm A',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  LOCALE: 'en-IN',
} as const;