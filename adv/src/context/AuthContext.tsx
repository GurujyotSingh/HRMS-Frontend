import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'HRAdmin' | 'Director' | 'HOD' | 'Employee';
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
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ user: User }> => {
    // Simulate API call - replace with actual API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock user data based on email
        let user: User | null = null;
        
        if (email === 'admin@university.edu' && password === 'admin123') {
          user = {
            id: 1,
            email: 'admin@university.edu',
            name: 'Admin User',
            role: 'HRAdmin'
          };
        } else if (email === 'hod@university.edu' && password === 'hod123') {
          user = {
            id: 2,
            email: 'hod@university.edu',
            name: 'HOD User',
            role: 'HOD'
          };
        } else if (email === 'employee@university.edu' && password === 'emp123') {
          user = {
            id: 3,
            email: 'employee@university.edu',
            name: 'Employee User',
            role: 'Employee'
          };
        } else if (email === 'director@university.edu' && password === 'director123') {
          user = {
            id: 4,
            email: 'director@university.edu',
            name: 'Director User',
            role: 'Director'
          };
        }
        
        if (user) {
          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('auth_token', 'mock-token-' + Date.now());
          localStorage.setItem('isAuthenticated', 'true');
          
          setUser(user);
          resolve({ user });
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