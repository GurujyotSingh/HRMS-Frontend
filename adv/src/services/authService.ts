import type { User } from '../types/auth';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    // Simulate API call
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    return { token: data.token, user: data.user }; // Must return { token, user }
  },

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No token');

    const response = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch user');

    return response.json();
  },

  async logout() {
    await fetch('/api/logout', { method: 'POST' });
    // No need to handle response; just clean up
  },
};

// import { api } from './api';
// import { LoginCredentials, AuthResponse, User } from '../types/auth';

// class AuthService {
//   async login(credentials: LoginCredentials): Promise<AuthResponse> {
//     // Simulate API call - replace with actual API
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         const mockResponse: AuthResponse = {
//           user: {
//             user_id: 1,
//             employee_id: 1,
//             username: 'john.doe',
//             email: credentials.email,
//             roles: [{ 
//               role_id: 1, 
//               name: 'Employee', 
//               description: 'Employee Role', 
//               permissions: [] 
//             }],
//             permissions: [],
//             is_active: true,
//             name: 'John Doe',
//           },
//           token: 'mock_jwt_token_' + Date.now(),
//           refresh_token: 'mock_refresh_token_' + Date.now(),
//           expires_in: 3600,
//         };
//         resolve(mockResponse);
//       }, 1000);
//     });
//     // Actual implementation:
//     // return api.post<AuthResponse>('/auth/login', credentials);
//   }

//   async logout(): Promise<void> {
//     // Clear token
//     api.clearToken();
//     localStorage.removeItem('auth_token');
//     localStorage.removeItem('user');
//     sessionStorage.clear();
    
//     // Optional: Call logout API
//     // return api.post('/auth/logout', {});
//   }

//   async refreshToken(refreshToken: string): Promise<{ token: string }> {
//     return api.post('/auth/refresh', { refresh_token: refreshToken });
//   }

//   async forgotPassword(email: string): Promise<{ message: string }> {
//     return api.post('/auth/forgot-password', { email });
//   }

//   async resetPassword(token: string, password: string): Promise<{ message: string }> {
//     return api.post('/auth/reset-password', { token, password });
//   }

//   async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
//     return api.post('/auth/change-password', { oldPassword, newPassword });
//   }

//   async getCurrentUser(): Promise<User> {
//     // Simulate API call
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           user_id: 1,
//           employee_id: 1,
//           username: 'john.doe',
//           email: 'john.doe@university.edu',
//           roles: [{ 
//             role_id: 1, 
//             name: 'Employee', 
//             description: 'Employee Role', 
//             permissions: [] 
//           }],
//           permissions: [],
//           is_active: true,
//           name: 'John Doe',
//         });
//       }, 500);
//     });
//     // return api.get('/auth/me');
//   }
// }

// export const authService = new AuthService();