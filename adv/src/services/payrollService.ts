import { api } from './api';
import { Payroll, TaxDetail } from '../types/payroll';

class PayrollService {
  async getPayrollRecords(params?: Record<string, any>): Promise<Payroll[]> {
    return api.get('/payroll', params);
  }

  async getEmployeePayroll(employeeId: number, params?: Record<string, any>): Promise<Payroll[]> {
    return api.get(`/employees/${employeeId}/payroll`, params);
  }

  async getPayrollRecord(id: number): Promise<Payroll> {
    return api.get(`/payroll/${id}`);
  }

  async generatePayroll(data: {
    month: number;
    year: number;
    employeeIds?: number[];
  }): Promise<{ success: boolean; message: string }> {
    return api.post('/payroll/generate', data);
  }

  async processPayroll(id: number, data: { paymentMethod: string }): Promise<Payroll> {
    return api.post(`/payroll/${id}/process`, data);
  }

  async getPayslip(id: number, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
    return api.get(`/payroll/${id}/payslip?format=${format}`);
  }

  async getTaxDetails(employeeId: number, financialYear: string): Promise<TaxDetail> {
    return api.get(`/employees/${employeeId}/tax`, { financial_year: financialYear });
  }

  async updateSalary(employeeId: number, data: Partial<Payroll>): Promise<Payroll> {
    return api.put(`/employees/${employeeId}/salary`, data);
  }

  async generateSalaryCertificate(employeeId: number, year: number): Promise<Blob> {
    return api.get(`/employees/${employeeId}/salary-certificate`, { year });
  }
}

export const payrollService = new PayrollService();