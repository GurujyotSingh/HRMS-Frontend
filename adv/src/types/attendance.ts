

export interface Attendance {
  attendance_id: number;
  employee_id: number;
  employee?: AttendanceEmployee;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours?: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Holiday' | 'Leave';
  overtime_hours?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Minimal Employee interface for attendance context
 */
export interface AttendanceEmployee {
  emp_id: number;
  name: string;
  email?: string;
  department?: string;
  department_id?: number;
  designation?: string;
  avatar?: string;
}

/**
 * Attendance summary for a specific period
 */
export interface AttendanceSummary {
  employee_id: number;
  employee_name?: string;
  department?: string;
  month: number;
  year: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_hours: number;
  total_overtime: number;
  working_days: number;
  attendance_percentage: number;
}

/**
 * Monthly attendance summary
 */
export interface MonthlyAttendance {
  month: number;
  year: number;
  records: Attendance[];
  summary: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    holiday: number;
    total_days: number;
    total_hours: number;
  };
}

/**
 * Attendance filter parameters
 */
export interface AttendanceFilter {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  status?: string;
  month?: number;
  year?: number;
  search?: string;
}

/**
 * Bulk attendance update payload
 */
export interface BulkAttendanceUpdate {
  date: string;
  records: {
    employee_id: number;
    clock_in?: string;
    clock_out?: string;
    status?: string;
    notes?: string;
    total_hours?: number;
  }[];
}

/**
 * Attendance statistics for dashboard
 */
export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  holidayToday: boolean;
  averageHoursToday: number;
  attendanceRate: number;
  weeklyTrend: WeeklyTrend[];
  departmentStats: DepartmentAttendanceStats[];
  hourlyDistribution?: HourlyDistribution[];
}

/**
 * Weekly attendance trend
 */
export interface WeeklyTrend {
  date: string;
  day: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  percentage: number;
}

/**
 * Department-wise attendance statistics
 */
export interface DepartmentAttendanceStats {
  department_id: number;
  department_name: string;
  total_employees: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendance_percentage: number;
}

/**
 * Hourly distribution of check-ins
 */
export interface HourlyDistribution {
  hour: number;
  count: number;
  label: string;
}

/**
 * Clock In/Out request payload
 */
export interface ClockInOutRequest {
  employee_id: number;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  photo?: string;
  notes?: string;
  method?: 'manual' | 'wifi' | 'gps' | 'face';
}

/**
 * Clock In/Out response
 */
export interface ClockInOutResponse {
  attendance_id: number;
  employee_id: number;
  employee_name: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  message: string;
  date: string;
  total_hours?: number;
}

/**
 * Attendance report data
 */
export interface AttendanceReport {
  generated_date: string;
  generated_by: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    total_days: number;
    total_employees: number;
    average_attendance: number;
    total_present: number;
    total_absent: number;
    total_late: number;
    total_leave: number;
    total_overtime_hours: number;
    overall_percentage: number;
  };
  department_wise: DepartmentReport[];
  employee_wise: EmployeeReport[];
  trends: ReportTrend[];
}

/**
 * Department-wise report data
 */
export interface DepartmentReport {
  department_id: number;
  department_name: string;
  total_employees: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendance_percentage: number;
  total_hours: number;
  average_hours: number;
}

/**
 * Employee-wise report data
 */
export interface EmployeeReport {
  employee_id: number;
  employee_name: string;
  department: string;
  designation: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendance_percentage: number;
  total_hours: number;
  overtime_hours: number;
}

/**
 * Report trend data
 */
export interface ReportTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

/**
 * Attendance settings interface
 */
export interface AttendanceSettings {
  work_hours: {
    start_time: string;
    end_time: string;
    grace_period: number; // minutes
    work_days: string[]; // ['Monday', 'Tuesday', ...]
  };
  overtime: {
    enabled: boolean;
    rate: number; // multiplier
    min_hours: number; // minimum hours to qualify for overtime
    approval_required: boolean;
  };
  location_tracking: {
    enabled: boolean;
    latitude?: number;
    longitude?: number;
    radius?: number; // meters
  };
  notifications: {
    reminder: boolean;
    reminder_time: string;
    late_alert: boolean;
    absent_alert: boolean;
  };
  holiday_list: Holiday[];
}

/**
 * Holiday interface
 */
export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'National' | 'Religious' | 'University' | 'Optional';
  is_paid: boolean;
  recurring?: boolean;
  year?: number;
}

/**
 * Leave integration interface
 */
export interface LeaveIntegration {
  leave_id: number;
  employee_id: number;
  leave_date: string;
  leave_type: string;
  is_half_day: boolean;
  approved: boolean;
}

/**
 * Attendance correction request
 */
export interface AttendanceCorrection {
  correction_id: number;
  attendance_id: number;
  employee_id: number;
  requested_by: number;
  requested_date: string;
  original_clock_in?: string;
  original_clock_out?: string;
  requested_clock_in?: string;
  requested_clock_out?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number;
  approved_date?: string;
  comments?: string;
}

/**
 * Attendance export options
 */
export interface AttendanceExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  date_range: {
    start: string;
    end: string;
  };
  departments?: number[];
  employees?: number[];
  include_summary: boolean;
  include_details: boolean;
}

/**
 * Daily attendance summary for a department
 */
export interface DailyDepartmentSummary {
  date: string;
  department_id: number;
  department_name: string;
  total_employees: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  present_percentage: number;
  employees: {
    present: EmployeeAttendanceStatus[];
    absent: EmployeeAttendanceStatus[];
    late: EmployeeAttendanceStatus[];
    leave: EmployeeAttendanceStatus[];
  };
}

/**
 * Employee attendance status for daily view
 */
export interface EmployeeAttendanceStatus {
  employee_id: number;
  employee_name: string;
  clock_in?: string;
  clock_out?: string;
  total_hours?: number;
  status: string;
  notes?: string;
}

/**
 * Attendance graph data point
 */
export interface AttendanceGraphData {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

/**
 * Punch card data for an employee
 */
export interface PunchCard {
  employee_id: number;
  employee_name: string;
  month: number;
  year: number;
  days: {
    [key: number]: {
      date: string;
      day: string;
      clock_in?: string;
      clock_out?: string;
      total_hours?: number;
      status: string;
      is_holiday: boolean;
      is_leave: boolean;
    };
  };
  summary: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    holidays: number;
    total_hours: number;
    working_days: number;
  };
}