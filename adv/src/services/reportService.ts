import { api } from './api';
import { Report, AnalyticsData } from '../types/report';

class ReportService {
  async getAnalytics(params?: Record<string, any>): Promise<AnalyticsData> {
    return api.get('/reports/analytics', params);
  }

  async getReports(params?: Record<string, any>): Promise<Report[]> {
    return api.get('/reports', params);
  }

  async getReport(id: number): Promise<Report> {
    return api.get(`/reports/${id}`);
  }

  async createReport(data: {
    name: string;
    type: string;
    parameters: Record<string, any>;
  }): Promise<Report> {
    return api.post('/reports', data);
  }

  async generateReport(id: number, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
    return api.get(`/reports/${id}/generate?format=${format}`);
  }

  async scheduleReport(data: {
    reportId: number;
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  }): Promise<void> {
    return api.post('/reports/schedule', data);
  }

  async getCustomReportData(params: {
    fields: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
  }): Promise<any[]> {
    return api.post('/reports/custom', params);
  }

  async exportData(params: {
    type: string[];
    format: 'csv' | 'excel' | 'pdf';
    dateRange?: { start: string; end: string };
  }): Promise<Blob> {
    return api.post('/reports/export', params);
  }
}

export const reportService = new ReportService();