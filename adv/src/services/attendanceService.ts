import { api } from './api';
import { Attendance, AttendanceSummary } from '../types/attendance';

class AttendanceService {
  async getAttendance(params?: Record<string, any>): Promise<Attendance[]> {
    return api.get('/attendance', params);
  }

  async getEmployeeAttendance(employeeId: number, params?: Record<string, any>): Promise<Attendance[]> {
    return api.get(`/employees/${employeeId}/attendance`, params);
  }

  async clockIn(data: { employeeId: number; location?: string; photo?: string }): Promise<Attendance> {
    return api.post('/attendance/clock-in', data);
  }

  async clockOut(data: { employeeId: number; location?: string }): Promise<Attendance> {
    return api.post('/attendance/clock-out', data);
  }

  async updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance> {
    return api.put(`/attendance/${id}`, data);
  }

  async getAttendanceSummary(employeeId: number, month: number, year: number): Promise<AttendanceSummary> {
    return api.get(`/employees/${employeeId}/attendance/summary`, { month, year });
  }

  async getDepartmentAttendance(departmentId: number, date: string): Promise<Attendance[]> {
    return api.get(`/departments/${departmentId}/attendance`, { date });
  }

  async generateReport(params: {
    startDate: string;
    endDate: string;
    departmentId?: number;
  }): Promise<Blob> {
    return api.get('/attendance/report', { ...params, format: 'pdf' });
  }

  async bulkUpdateAttendance(data: { date: string; records: Partial<Attendance>[] }): Promise<void> {
    return api.post('/attendance/bulk-update', data);
  }
}

export const attendanceService = new AttendanceService();