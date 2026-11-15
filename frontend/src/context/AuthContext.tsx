import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: { email: string; password: string; full_name: string; role: string; phone_number?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carecircle_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('carecircle_token');
    if (token) {
      authService.getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem('carecircle_user', JSON.stringify(u));
        })
        .catch(() => {
          authService.logout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authService.login({ email, password });
    localStorage.setItem('carecircle_token', data.access_token);
    localStorage.setItem('carecircle_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    phone_number?: string;
  }): Promise<User> => {
    const data = await authService.register(userData);
    localStorage.setItem('carecircle_token', data.access_token);
    localStorage.setItem('carecircle_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const u = await authService.getMe();
      setUser(u);
      localStorage.setItem('carecircle_user', JSON.stringify(u));
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
