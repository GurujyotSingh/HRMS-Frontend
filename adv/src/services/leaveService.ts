import { api } from './api';
import { LeaveApplication, LeaveType, LeaveBalance } from '../types/leave';

class LeaveService {
  async getLeaveRequests(params?: Record<string, any>): Promise<LeaveApplication[]> {
    return api.get('/leave-requests', params);
  }

  async getLeaveRequest(id: number): Promise<LeaveApplication> {
    return api.get(`/leave-requests/${id}`);
  }

  async createLeaveRequest(data: Partial<LeaveApplication>): Promise<LeaveApplication> {
    return api.post('/leave-requests', data);
  }

  async updateLeaveRequest(id: number, data: Partial<LeaveApplication>): Promise<LeaveApplication> {
    return api.put(`/leave-requests/${id}`, data);
  }

  async approveLeaveRequest(id: number, comments?: string): Promise<LeaveApplication> {
    return api.post(`/leave-requests/${id}/approve`, { comments });
  }

  async rejectLeaveRequest(id: number, comments: string): Promise<LeaveApplication> {
    return api.post(`/leave-requests/${id}/reject`, { comments });
  }

  async cancelLeaveRequest(id: number): Promise<LeaveApplication> {
    return api.post(`/leave-requests/${id}/cancel`, {});
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return api.get('/leave-types');
  }

  async getLeaveBalance(employeeId: number, year?: number): Promise<LeaveBalance[]> {
    return api.get(`/employees/${employeeId}/leave-balance`, { year });
  }

  async getDepartmentLeaveBalance(departmentId: number, year?: number): Promise<LeaveBalance[]> {
    return api.get(`/departments/${departmentId}/leave-balance`, { year });
  }

  async adjustLeaveBalance(data: {
    employeeId: number;
    leaveTypeId: number;
    days: number;
    reason: string;
    type: 'add' | 'deduct';
  }): Promise<LeaveBalance> {
    return api.post('/leave-balance/adjust', data);
  }
}

export const leaveService = new LeaveService();