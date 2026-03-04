export interface User {
  permissions: any;
  roles: any;
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}    
//  User interface
 export interface User {
   user_id: number;
   employee_id?: number;
   employee?: any;
   username: string;
   email: string;
   roles: Role[];
   permissions: Permission[];
   last_login?: string;
   is_active: boolean;
   name?: string;
   profilePicture?: string;
   role?: string;
 }

  // Role interface
 export interface Role {
   role_id: number;
   name: 'Employee' | 'HOD' | 'HRAdmin' | 'Director';
   description: string;
   permissions: Permission[];
 }

  // Permission interface
 export interface Permission {
   permission_id: number;
   name: string;
   code: string;
   module: string;
 }

  // Login credentials interface
 export interface LoginCredentials {
   email: string;
   password: string;
   remember?: boolean;
 }

  // Auth response interface - THIS WAS MISSING
 export interface AuthResponse {
   user: User;
   token: string;
   refresh_token: string;
   expires_in: number;
 }

  // Employee interface (minimal version for auth)
 export interface Employee {
   emp_id: number;
   name: string;
   email: string;
   department?: string;
   role?: string;
 }