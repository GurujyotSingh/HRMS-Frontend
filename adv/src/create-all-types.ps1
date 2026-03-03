# create-types.ps1
Write-Host "Creating all type files..." -ForegroundColor Green

# Create types directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "types" | Out-Null

# Create auth.ts
@"
// Auth Types
export interface User {
  user_id: number;
  username: string;
  email: string;
  roles: any[];
  permissions: any[];
  is_active: boolean;
  name?: string;
  profilePicture?: string;
  role?: string;
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  permissions: any[];
}

export interface Permission {
  permission_id: number;
  name: string;
  code: string;
  module: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Employee {
  emp_id: number;
  name: string;
  email: string;
  department?: string;
  role?: string;
}
"@ | Out-File -FilePath "types/auth.ts" -Encoding UTF8

# Create employee.ts
@"
// Employee Types
export interface Employee {
  emp_id: number;
  name: string;
  email: string;
  department_id: number;
  department?: Department;
  manager_id?: number;
  manager?: Employee;
  academic_rank: string;
  hire_date: string;
  status: string;
  phone: string;
  address: string;
  emergency_contact: string;
  skills?: string[];
  competencies?: string[];
}

export interface Department {
  dept_id: number;
  name: string;
  code: string;
  head_id?: number;
  head?: Employee;
  budget: number;
}
"@ | Out-File -FilePath "types/employee.ts" -Encoding UTF8

# Create leave.ts
@"
// Leave Types
export interface LeaveApplication {
  leave_id: number;
  employee_id: number;
  employee?: Employee;
  leave_type_id: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  days_applied: number;
  reason: string;
  status: string;
  applied_on: string;
  approved_by?: number;
  approver?: Employee;
  approved_on?: string;
  comments?: string;
}

export interface LeaveType {
  type_id: number;
  name: string;
  code: string;
  days_allowed: number;
  is_paid: boolean;
}

export interface LeaveBalance {
  balance_id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  carried_forward: number;
}
"@ | Out-File -FilePath "types/leave.ts" -Encoding UTF8

# Create attendance.ts
@"
// Attendance Types
export interface Attendance {
  attendance_id: number;
  employee_id: number;
  employee?: Employee;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours?: number;
  status: string;
  overtime_hours?: number;
  notes?: string;
}

export interface AttendanceSummary {
  employee_id: number;
  month: number;
  year: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_hours: number;
  total_overtime: number;
}
"@ | Out-File -FilePath "types/attendance.ts" -Encoding UTF8

# Create employeeTask.ts
@"
// Task Types
export interface EmployeeTask {
  task_id: number;
  employee_id: number;
  employee?: Employee;
  task_type: string;
  task_name: string;
  description: string;
  due_date: string;
  completed_date?: string;
  status: string;
  assigned_by: number;
  assigner?: Employee;
  priority: string;
  category: string;
}
"@ | Out-File -FilePath "types/employeeTask.ts" -Encoding UTF8

# Create performance.ts
@"
// Performance Types
export interface PerformanceReview {
  review_id: number;
  employee_id: number;
  employee?: Employee;
  reviewer_id: number;
  reviewer?: Employee;
  review_period: string;
  review_date?: string;
  overall_rating?: number;
  comments?: string;
  goals?: string;
  achievements?: string;
  areas_for_improvement?: string;
  status: string;
}

export interface PerformanceRating {
  rating_id: number;
  review_id: number;
  criteria: string;
  rating: number;
  weight: number;
  comments?: string;
}
"@ | Out-File -FilePath "types/performance.ts" -Encoding UTF8

# Create resource.ts
@"
// Resource Types
export interface ResourceBooking {
  booking_id: number;
  resource_type: string;
  resource_id: number;
  booked_by: number;
  employee?: Employee;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  status: string;
  approved_by?: number;
  approver?: Employee;
}

export interface Room {
  room_id: number;
  name: string;
  capacity: number;
  location: string;
  facilities: string[];
  is_available: boolean;
}

export interface Equipment {
  equipment_id: number;
  name: string;
  type: string;
  serial_number: string;
  condition: string;
  location: string;
  is_available: boolean;
}

export interface TravelClaim {
  claim_id: number;
  employee_id: number;
  employee?: Employee;
  purpose: string;
  destination: string;
  start_date: string;
  end_date: string;
  estimated_amount: number;
  actual_amount?: number;
  receipts?: string[];
  status: string;
  approved_by?: number;
  approver?: Employee;
  approved_on?: string;
  comments?: string;
}
"@ | Out-File -FilePath "types/resource.ts" -Encoding UTF8

# Create payroll.ts
@"
// Payroll Types
export interface Payroll {
  payroll_id: number;
  employee_id: number;
  employee?: Employee;
  month: number;
  year: number;
  basic_salary: number;
  allowances: any[];
  deductions: any[];
  gross_pay: number;
  net_pay: number;
  payment_date?: string;
  payment_method: string;
  status: string;
  notes?: string;
}

export interface Allowance {
  allowance_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export interface Deduction {
  deduction_id: number;
  name: string;
  amount: number;
  is_mandatory: boolean;
}

export interface TaxDetail {
  tax_id: number;
  employee_id: number;
  financial_year: string;
  pan_number: string;
  total_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_amount: number;
  rebate?: number;
  net_tax: number;
}
"@ | Out-File -FilePath "types/payroll.ts" -Encoding UTF8

# Create calendar.ts
@"
// Calendar Types
export interface CalendarEvent {
  event_id: number;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  created_by: number;
  creator?: Employee;
  attendees?: number[];
}

export interface Holiday {
  holiday_id: number;
  name: string;
  date: string;
  type: string;
  is_paid: boolean;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  priority: string;
}
"@ | Out-File -FilePath "types/calendar.ts" -Encoding UTF8

# Create report.ts
@"
// Report Types
export interface Report {
  report_id: number;
  name: string;
  type: string;
  parameters: Record<string, any>;
  generated_by: number;
  generated_on: string;
  format: string;
  file_url: string;
}

export interface AnalyticsData {
  total_employees: number;
  active_employees: number;
  new_hires: number;
  turnover_rate: number;
  leave_utilization: Record<string, number>;
  attendance_rate: number;
  payroll_total: number;
  department_stats: Record<string, any>;
  trends: Array<{ period: string; metric: string; value: number }>;
}

export interface TrendData {
  period: string;
  metric: string;
  value: number;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
}

export interface ReportField {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

export interface SavedReport {
  id: string;
  name: string;
  type: string;
  chartType?: string;
  fields: ReportField[];
  filters: ReportFilter[];
  createdAt: string;
  createdBy: number;
}

export interface ExportOptions {
  format: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeHeaders: boolean;
  compress: boolean;
  sendEmail: boolean;
  includeHistorical: boolean;
}

export interface ExportJob {
  id: string;
  name: string;
  status: string;
  progress: number;
  fileUrl?: string;
  createdAt: string;
}
"@ | Out-File -FilePath "types/report.ts" -Encoding UTF8

# Create common.ts
@"
// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon?: any;
  permissions?: string[];
  children?: MenuItem[];
}

export interface FileUpload {
  file: File;
  progress: number;
  status: string;
  url?: string;
  error?: string;
}
"@ | Out-File -FilePath "types/common.ts" -Encoding UTF8

Write-Host "All type files created successfully!" -ForegroundColor Green
Write-Host "Location: .\types\" -ForegroundColor Yellow