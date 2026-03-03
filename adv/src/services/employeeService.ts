import { api } from './api';
import { Employee, Department } from '../types/employee';

class EmployeeService {
  async getEmployees(params?: Record<string, any>): Promise<Employee[]> {
    return api.get('/employees', params);
  }

  async getEmployee(id: number): Promise<Employee> {
    return api.get(`/employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    return api.post('/employees', data);
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    return api.put(`/employees/${id}`, data);
  }

  async deleteEmployee(id: number): Promise<void> {
    return api.delete(`/employees/${id}`);
  }

  async getDepartments(): Promise<Department[]> {
    return api.get('/departments');
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return api.get('/employees', { department_id: departmentId });
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return api.get('/employees/search', { q: query });
  }

  async bulkUploadEmployees(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/employees/bulk', formData);
  }

  async exportEmployees(format: 'csv' | 'excel'): Promise<Blob> {
    return api.get(`/employees/export?format=${format}`);
  }
}

export const employeeService = new EmployeeService();