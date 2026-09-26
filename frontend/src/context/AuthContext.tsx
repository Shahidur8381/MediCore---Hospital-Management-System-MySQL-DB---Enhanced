'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserProfile {
  NAME?: string;
  SPECIALIZATION?: string;
  QUALIFICATION?: string;
  PHONE?: string;
  EMAIL?: string;
  GENDER?: string;
  BLOOD_GROUP?: string;
  ADDRESS?: string;
  EMERGENCY_CONTACT?: string;
  DATE_OF_BIRTH?: string;
  REGISTRATION_DATE?: string;
  JOINING_DATE?: string;
  CONSULTATION_FEE?: number;
  STATUS?: string;
  DEPARTMENT_NAME?: string;
}

interface User {
  id: number;
  role: string;
  username: string;
  doctorId?: number;
  patientId?: number;
  profile?: UserProfile;
  isGuestAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchProfile();
      }
      setLoading(false);
    };
    loadUser();
  }, [fetchProfile]);

  const login = async (token: string, userData: User) => {
    localStorage.setItem('token', token);
    // Immediately fetch full profile so dashboards have all data
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
