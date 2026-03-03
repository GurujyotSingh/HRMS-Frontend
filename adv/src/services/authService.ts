import { api } from './api';
import { User, LoginCredentials, AuthResponse } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API call - replace with actual API
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponse: AuthResponse = {
          user: {
            user_id: 1,
            employee_id: 1,
            username: 'john.doe',
            email: credentials.email,
            roles: [{ role_id: 1, name: 'Employee', description: 'Employee Role', permissions: [] }],
            permissions: [],
            is_active: true,
          },
          token: 'mock_jwt_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
        };
        resolve(mockResponse);
      }, 1000);
    });
    // Actual implementation:
    // return api.post<AuthResponse>('/auth/login', credentials);
  }

  async logout(): Promise<void> {
    api.clearToken();
    // return api.post('/auth/logout', {});
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return api.post('/auth/reset-password', { token, password });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return api.post('/auth/change-password', { oldPassword, newPassword });
  }

  async getCurrentUser(): Promise<User> {
    return api.get('/auth/me');
  }
}

export const authService = new AuthService();