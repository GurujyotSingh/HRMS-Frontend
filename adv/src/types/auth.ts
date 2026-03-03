// Auth Types 
export interface User { user_id: number; username: string; email: string; roles: any[]; permissions: any[]; is_active: boolean; name?: string; profilePicture?: string; role?: string; } 
export interface Role { role_id: number; name: string; description: string; permissions: any[]; } 
export interface Permission { permission_id: number; name: string; code: string; module: string; } 
export interface LoginCredentials { email: string; password: string; remember?: boolean; } 
export interface AuthResponse { user: User; token: string; refresh_token: string; expires_in: number; } 
export interface Employee { emp_id: number; name: string; email: string; department?: string; role?: string; } 
