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
