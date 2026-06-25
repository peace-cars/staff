import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { unwrapApiResponse, API_URL } from './api';

import { Capacitor } from '@capacitor/core';

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  branch_id: string | null;
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
  signup: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  loginWithGoogle: async () => ({}),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = React.useCallback(async () => {
    // Clear state first — guarantees logout works even if the network call fails
    localStorage.removeItem('staff_session');
    localStorage.removeItem('staffId');
    setSession(null);
    // Fire-and-forget server-side cookie cleanup
    fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('staff_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const nowSec = Math.floor(Date.now() / 1000);

          // If token has expired or has less than 15 minutes remaining, refresh it!
          if (parsed.expires_at && parsed.expires_at - nowSec < 900) {
            console.log('[Staff Auth] Token is expiring or expired, attempting refresh...');
            const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
            if (res.ok) {
              const result = await res.json();
              const refreshed = result.data ?? result;
              const newSessionData: SessionData = {
                // Store real access_token so apiClient Bearer headers work
                access_token: refreshed.session?.access_token || parsed.access_token || '',
                refresh_token: '',
                expires_at: refreshed.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
                user: refreshed.user || parsed.user,
                profile: refreshed.profile || parsed.profile,
              };
              localStorage.setItem('staff_session', JSON.stringify(newSessionData));
              localStorage.setItem('staffId', (refreshed.user || parsed.user).id);
              setSession(newSessionData);
              setLoading(false);
              return;
            } else {
              console.warn(`[Staff Auth] Refresh failed with status ${res.status}`);
              if (res.status === 401 || res.status === 403 || res.status === 400) {
                console.warn('[Staff Auth] Token invalid, logging out');
                localStorage.removeItem('staff_session');
                localStorage.removeItem('staffId');
                setSession(null);
              } else {
                console.warn('[Staff Auth] Server error during refresh, keeping stale session');
                setSession(parsed);
              }
              // Fall through so setLoading(false) is reached below
            }
          } else {
            setSession(parsed);
          }
        } catch (e) {
          console.error('[Staff Auth] Init error:', e);
          if (e instanceof SyntaxError) {
            localStorage.removeItem('staff_session');
          } else {
            setSession(JSON.parse(stored));
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Token refresh is now handled reactively by the API 401 interceptor.
  // No background polling needed — eliminates single-use-token race conditions.

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = unwrapApiResponse(await res.json());

      if (!res.ok) {
        return { error: data?.message || 'Login failed' };
      }

      // Verify staff role - allow any staff-tier role
      const role = data.profile?.role;
      const staffRoles = ['STAFF', 'DISTRICT_MANAGER', 'GENERAL_MANAGER', 'FINANCE_AUDITOR'];
      if (!role || !staffRoles.includes(role)) {
        return {
          error: 'ACCESS DENIED: This portal is for Staff only. Your role: ' + (role || 'NONE'),
        };
      }

      const sessionData: SessionData = {
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
        expires_at: data.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('staff_session', JSON.stringify(sessionData));
      localStorage.setItem('staffId', data.user.id);
      setSession(sessionData);

      // Supabase realtime is disabled

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phoneNumber: phone, role: 'STAFF' }),
      });

      const data = unwrapApiResponse(await res.json());
      if (!res.ok) {
        return { error: data?.message || 'Signup failed' };
      }

      // Successful signup triggers auth directly
      const signupRole = data.profile?.role;
      const validStaffRoles = ['STAFF', 'DISTRICT_MANAGER', 'GENERAL_MANAGER', 'FINANCE_AUDITOR'];
      if (!signupRole || !validStaffRoles.includes(signupRole)) {
        return { error: 'Role assignment failed. Please contact IT.' };
      }

      const sessionData: SessionData = {
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
        expires_at: data.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('staff_session', JSON.stringify(sessionData));
      localStorage.setItem('staffId', data.user.id);
      setSession(sessionData);

      // Supabase realtime is disabled

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
