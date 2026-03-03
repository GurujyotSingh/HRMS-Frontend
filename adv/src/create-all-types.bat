@echo off
echo Creating all type files...

mkdir src\types 2>nul

:: Create auth.ts
echo // Auth Types > src\types\auth.ts
echo export interface User { user_id: number; username: string; email: string; roles: any[]; permissions: any[]; is_active: boolean; name?: string; profilePicture?: string; role?: string; } >> src\types\auth.ts
echo export interface Role { role_id: number; name: string; description: string; permissions: any[]; } >> src\types\auth.ts
echo export interface Permission { permission_id: number; name: string; code: string; module: string; } >> src\types\auth.ts
echo export interface LoginCredentials { email: string; password: string; remember?: boolean; } >> src\types\auth.ts
echo export interface AuthResponse { user: User; token: string; refresh_token: string; expires_in: number; } >> src\types\auth.ts
echo export interface Employee { emp_id: number; name: string; email: string; department?: string; role?: string; } >> src\types\auth.ts

:: Create employee.ts
echo // Employee Types > src\types\employee.ts
echo export interface Employee { emp_id: number; name: string; email: string; department_id: number; department?: Department; manager_id?: number; manager?: Employee; academic_rank: string; hire_date: string; status: string; phone: string; address: string; emergency_contact: string; skills?: string[]; competencies?: string[]; } >> src\types\employee.ts
echo export interface Department { dept_id: number; name: string; code: string; head_id?: number; head?: Employee; budget: number; } >> src\types\employee.ts

:: Create leave.ts
echo // Leave Types > src\types\leave.ts
echo export interface LeaveApplication { leave_id: number; employee_id: number; employee?: Employee; leave_type_id: number; leave_type?: LeaveType; start_date: string; end_date: string; days_applied: number; reason: string; status: string; applied_on: string; approved_by?: number; approver?: Employee; approved_on?: string; comments?: string; } >> src\types\leave.ts
echo export interface LeaveType { type_id: number; name: string; code: string; days_allowed: number; is_paid: boolean; } >> src\types\leave.ts
echo export interface LeaveBalance { balance_id: number; employee_id: number; leave_type_id: number; year: number; total_days: number; used_days: number; remaining_days: number; carried_forward: number; } >> src\types\leave.ts

:: Create attendance.ts
echo // Attendance Types > src\types\attendance.ts
echo export interface Attendance { attendance_id: number; employee_id: number; employee?: Employee; date: string; clock_in: string | null; clock_out: string | null; total_hours?: number; status: string; overtime_hours?: number; notes?: string; } >> src\types\attendance.ts
echo export interface AttendanceSummary { employee_id: number; month: number; year: number; total_present: number; total_absent: number; total_late: number; total_hours: number; total_overtime: number; } >> src\types\attendance.ts

:: Create employeeTask.ts
echo // Task Types > src\types\employeeTask.ts
echo export interface EmployeeTask { task_id: number; employee_id: number; employee?: Employee; task_type: string; task_name: string; description: string; due_date: string; completed_date?: string; status: string; assigned_by: number; assigner?: Employee; priority: string; category: string; } >> src\types\employeeTask.ts

:: Create performance.ts
echo // Performance Types > src\types\performance.ts
echo export interface PerformanceReview { review_id: number; employee_id: number; employee?: Employee; reviewer_id: number; reviewer?: Employee; review_period: string; review_date?: string; overall_rating?: number; comments?: string; goals?: string; achievements?: string; areas_for_improvement?: string; status: string; } >> src\types\performance.ts
echo export interface PerformanceRating { rating_id: number; review_id: number; criteria: string; rating: number; weight: number; comments?: string; } >> src\types\performance.ts

:: Create resource.ts
echo // Resource Types > src\types\resource.ts
echo export interface ResourceBooking { booking_id: number; resource_type: string; resource_id: number; booked_by: number; employee?: Employee; start_datetime: string; end_datetime: string; purpose: string; status: string; approved_by?: number; approver?: Employee; } >> src\types\resource.ts
echo export interface Room { room_id: number; name: string; capacity: number; location: string; facilities: string[]; is_available: boolean; } >> src\types\resource.ts
echo export interface Equipment { equipment_id: number; name: string; type: string; serial_number: string; condition: string; location: string; is_available: boolean; } >> src\types\resource.ts
echo export interface TravelClaim { claim_id: number; employee_id: number; employee?: Employee; purpose: string; destination: string; start_date: string; end_date: string; estimated_amount: number; actual_amount?: number; receipts?: string[]; status: string; approved_by?: number; approver?: Employee; approved_on?: string; comments?: string; } >> src\types\resource.ts

:: Create payroll.ts
echo // Payroll Types > src\types\payroll.ts
echo export interface Payroll { payroll_id: number; employee_id: number; employee?: Employee; month: number; year: number; basic_salary: number; allowances: any[]; deductions: any[]; gross_pay: number; net_pay: number; payment_date?: string; payment_method: string; status: string; notes?: string; } >> src\types\payroll.ts
echo export interface Allowance { allowance_id: number; name: string; amount: number; is_taxable: boolean; } >> src\types\payroll.ts
echo export interface Deduction { deduction_id: number; name: string; amount: number; is_mandatory: boolean; } >> src\types\payroll.ts
echo export interface TaxDetail { tax_id: number; employee_id: number; financial_year: string; pan_number: string; total_income: number; total_deductions: number; taxable_income: number; tax_amount: number; rebate?: number; net_tax: number; } >> src\types\payroll.ts

:: Create calendar.ts
echo // Calendar Types > src\types\calendar.ts
echo export interface CalendarEvent { event_id: number; title: string; description?: string; event_type: string; start_datetime: string; end_datetime: string; location?: string; is_all_day: boolean; created_by: number; creator?: Employee; attendees?: number[]; } >> src\types\calendar.ts
echo export interface Holiday { holiday_id: number; name: string; date: string; type: string; is_paid: boolean; } >> src\types\calendar.ts
echo export interface Notification { notification_id: number; user_id: number; type: string; title: string; message: string; is_read: boolean; created_at: string; action_url?: string; priority: string; } >> src\types\calendar.ts

:: Create report.ts
echo // Report Types > src\types\report.ts
echo export interface Report { report_id: number; name: string; type: string; parameters: Record<string, any>; generated_by: number; generated_on: string; format: string; file_url: string; } >> src\types\report.ts
echo export interface AnalyticsData { total_employees: number; active_employees: number; new_hires: number; turnover_rate: number; leave_utilization: Record<string, number>; attendance_rate: number; payroll_total: number; department_stats: Record<string, any>; trends: Array<{ period: string; metric: string; value: number }>; } >> src\types\report.ts
echo export interface TrendData { period: string; metric: string; value: number; } >> src\types\report.ts
echo export interface ReportFilter { field: string; operator: string; value: any; } >> src\types\report.ts
echo export interface ReportField { id: string; name: string; category: string; selected: boolean; } >> src\types\report.ts
echo export interface SavedReport { id: string; name: string; type: string; chartType?: string; fields: ReportField[]; filters: ReportFilter[]; createdAt: string; createdBy: number; } >> src\types\report.ts
echo export interface ExportOptions { format: string; dateRange?: { start: string; end: string; }; includeHeaders: boolean; compress: boolean; sendEmail: boolean; includeHistorical: boolean; } >> src\types\report.ts
echo export interface ExportJob { id: string; name: string; status: string; progress: number; fileUrl?: string; createdAt: string; } >> src\types\report.ts

:: Create common.ts
echo // Common Types > src\types\common.ts
echo export interface ApiResponse<T = any> { success: boolean; data?: T; error?: string; message?: string; } >> src\types\common.ts
echo export interface PaginatedResponse<T = any> { data: T[]; total: number; page: number; limit: number; totalPages: number; } >> src\types\common.ts
echo export interface SelectOption { value: string | number; label: string; } >> src\types\common.ts
echo export interface BreadcrumbItem { label: string; path?: string; } >> src\types\common.ts
echo export interface MenuItem { label: string; path: string; icon?: any; permissions?: string[]; children?: MenuItem[]; } >> src\types\common.ts
echo export interface FileUpload { file: File; progress: number; status: string; url?: string; error?: string; } >> src\types\common.ts

echo All type files created successfully!