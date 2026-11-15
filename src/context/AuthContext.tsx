import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabaseApi } from '../services/supabaseApi';
import { Subscription, User } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  planId?: string;
}

interface AuthContextValue {
  user: User | null;
  activeSubscription: Subscription | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('verdant_token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('verdant_token');
    if (!storedToken) {
      setUser(null);
      setActiveSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const data = await supabaseApi.verifyAndLoadProfile(storedToken);
      setUser(data.user);
      setActiveSubscription(data.activeSubscription);
    } catch {
      localStorage.removeItem('verdant_token');
      setToken(null);
      setUser(null);
      setActiveSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await supabaseApi.login(email, password);
    localStorage.setItem('verdant_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setActiveSubscription(data.activeSubscription);
    return data.user;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const data = await supabaseApi.register(payload);
    localStorage.setItem('verdant_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setActiveSubscription(null);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('verdant_token');
    setToken(null);
    setUser(null);
    setActiveSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeSubscription,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
