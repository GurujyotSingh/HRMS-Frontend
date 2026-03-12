import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'HRAdmin' | 'Director' | 'HOD' | 'Employee' | 'Accountant'; // Add Accountant here
  roles?: { name: string }[];
  permissions?: { code: string }[];
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User }>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.roles) {
          parsedUser.roles = [{ name: parsedUser.role }];
        }
        if (!parsedUser.permissions) {
          parsedUser.permissions = [];
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ user: User }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let user: User | null = null;
        
        // Existing users
        if (email === 'admin@university.edu' && password === 'admin123') {
          user = {
            id: 1,
            email: 'admin@university.edu',
            name: 'Admin User',
            role: 'HRAdmin',
            roles: [{ name: 'HRAdmin' }],
            permissions: [],
          };
        } else if (email === 'hod@university.edu' && password === 'hod123') {
          user = {
            id: 2,
            email: 'hod@university.edu',
            name: 'HOD User',
            role: 'HOD',
            roles: [{ name: 'HOD' }],
            permissions: [],
          };
        } else if (email === 'employee@university.edu' && password === 'emp123') {
          user = {
            id: 3,
            email: 'employee@university.edu',
            name: 'Employee User',
            role: 'Employee',
            roles: [{ name: 'Employee' }],
            permissions: [],
          };
        } else if (email === 'director@university.edu' && password === 'director123') {
          user = {
            id: 4,
            email: 'director@university.edu',
            name: 'Director User',
            role: 'Director',
            roles: [{ name: 'Director' }],
            permissions: [],
          };
        } 
        // ✅ NEW: Accountant user
        else if (email === 'accountant@university.edu' && password === 'acc123') {
          user = {
            id: 5,
            email: 'accountant@university.edu',
            name: 'Accountant User',
            role: 'Accountant',
            roles: [{ name: 'Accountant' }],
            permissions: [],
          };
        }
        
        if (user) {
          const userWithRoles = {
            ...user,
            roles: user.roles || [{ name: user.role }],
            permissions: user.permissions || [],
          };
          
          localStorage.setItem('user', JSON.stringify(userWithRoles));
          localStorage.setItem('auth_token', 'mock-token-' + Date.now());
          localStorage.setItem('isAuthenticated', 'true');
          
          setUser(userWithRoles);
          resolve({ user: userWithRoles });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};