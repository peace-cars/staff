import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

import { Capacitor } from '@capacitor/core';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return (isLocalhost && !isNative) ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}` : 'https://backend-eabm.onrender.com';
};

const API_URL = getApiUrl();

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  location_id: string | null;
  is_verified: boolean;
  is_inspector_verified: boolean;
  gamification_points: number;
}

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email: string };
  profile: UserProfile;
}

interface AuthContextType {
  session: SessionData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = React.useCallback(() => {
    localStorage.removeItem('staff_session');
    localStorage.removeItem('staffId');
    setSession(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('staff_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Expiration Pulse: Check if session is already dead (Unix timestamp)
        const nowSec = Math.floor(Date.now() / 1000);
        if (parsed.expires_at && parsed.expires_at < nowSec) {
          console.warn('[Staff Auth] Session expired, clearing stale token.');
          localStorage.removeItem('staff_session');
          localStorage.removeItem('staffId');
          setSession(null);
        } else {
          setSession(parsed);
          // Sync Supabase client
          supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token
          });
        }
      } catch {
        localStorage.removeItem('staff_session');
      }
    }
    setLoading(false);
  }, []);

  // Periodic token expiry check - force logout if token expires mid-session
  useEffect(() => {
    if (!session?.expires_at) return;
    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (session.expires_at < nowSec) {
        console.warn('[Staff Auth] Token expired mid-session, logging out.');
        logout();
      }
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [session?.expires_at, logout]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || 'Login failed' };
      }

      // Verify staff role - allow any staff-tier role
      const role = data.profile?.role;
      const staffRoles = ['STAFF', 'DISTRICT_MANAGER', 'GENERAL_MANAGER', 'FINANCE_AUDITOR'];
      if (!role || !staffRoles.includes(role)) {
        return { error: 'ACCESS DENIED: This portal is for Staff only. Your role: ' + (role || 'NONE') };
      }

      const sessionData: SessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('staff_session', JSON.stringify(sessionData));
      localStorage.setItem('staffId', data.user.id);
      setSession(sessionData);

      // Handshake: Notify Supabase client
      await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const signup = async (email: string, password: string, fullName: string, phone: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phoneNumber: phone, role: 'STAFF' }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || 'Signup failed' };
      }

      // Successful signup triggers auth directly
      const signupRole = data.profile?.role;
      const validStaffRoles = ['STAFF', 'DISTRICT_MANAGER', 'GENERAL_MANAGER', 'FINANCE_AUDITOR'];
      if (!signupRole || !validStaffRoles.includes(signupRole)) {
        return { error: 'Role assignment failed. Please contact IT.' };
      }

      const sessionData: SessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('staff_session', JSON.stringify(sessionData));
      localStorage.setItem('staffId', data.user.id);
      setSession(sessionData);

      // Handshake: Notify Supabase client
      await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
