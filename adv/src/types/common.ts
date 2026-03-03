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
