import { Capacitor, CapacitorHttp } from '@capacitor/core';

// ─── Token Refresh Lock ───────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function onTokenRefreshed(newToken: string | null) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise(resolve => refreshQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const sessionStr = localStorage.getItem('staff_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;

    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session?.refresh_token }),
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        forceLogout();
      }
      onTokenRefreshed(null);
      return null;
    }

    const result = await res.json();
    const payload = result?.data ?? result;
    const newAccessToken = payload.session?.access_token || payload.access_token;

    if (newAccessToken && session) {
      const updatedSession = {
        ...session,
        access_token: newAccessToken,
        refresh_token: payload.session?.refresh_token || session.refresh_token,
        expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
      };
      localStorage.setItem('staff_session', JSON.stringify(updatedSession));
      console.log('[Staff API] Token refresh successful via interceptor.');
    }

    onTokenRefreshed(newAccessToken || null);
    return newAccessToken || null;
  } catch (err) {
    console.error('[Staff API] Token refresh failed (network/server error):', err);
    // DO NOT force logout on network errors
    onTokenRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

function forceLogout() {
  console.warn('[Staff API] Forcing logout due to invalid session.');
  localStorage.removeItem('staff_session');
  localStorage.removeItem('staffId');
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  let base =
    isLocalhost && !isNative ? 'http://localhost:3000' : 'https://backend-eabm.onrender.com';
  if (!base.endsWith('/api/v1')) {
    base = base.replace(/\/+$/, '') + '/api/v1';
  }
  return base;
};

export const API_URL = getApiUrl();

const CACHE_PREFIX = 'peace_cache_';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedData(key: string) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Don't use data older than 24h if we can avoid it, but better than nothing when offline
    return data;
  } catch (e) {
    return null;
  }
}

function setCachedData(key: string, data: any) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (e) {
    // If storage is full, clear old cache
    if (e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  }
}

export async function apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
  const method = options.method || 'GET';
  const isCacheable = method === 'GET';
  const cacheKey = btoa(endpoint); // Simple key
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const sessionStr = localStorage.getItem('staff_session');
  let token = null;

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      token = session.access_token;
    } catch (e) {
      console.error('[API] Failed to parse session', e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const executeRequest = async (): Promise<T> => {
    // Use Native HTTP for Mobile
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data: options.body ? JSON.parse(options.body) : undefined,
        connectTimeout: 8000,
        readTimeout: 8000,
      });

      if (response.status >= 400) {
        throw new Error(response.data?.message || `API Error ${response.status}`);
      }
      return unwrapApiResponse(response.data);
    }

    // Fallback for Web/PWA
    const response = await fetch(url, { ...options, headers, credentials: 'include' });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ message: 'API request failed' }));
      const err: any = new Error(errBody.message || 'API request failed');
      err.status = response.status;
      throw err;
    }
    const payload = await response.json();
    return unwrapApiResponse(payload);
  };

  try {
    const result = await executeRequest();
    if (isCacheable) setCachedData(cacheKey, result);
    return result;
  } catch (error: any) {
    // ── 401 Interceptor ──────────────────────────────────────────────
    if (error?.status === 401) {
      console.warn(`[Staff API] 401 on ${endpoint} — attempting token refresh...`);
      const newToken = await attemptTokenRefresh();
      if (newToken) {
        try {
          const retryRes = await fetch(url, {
            ...options,
            headers: { ...headers, 'Authorization': `Bearer ${newToken}` },
            credentials: 'include',
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const result = unwrapApiResponse(retryData);
            if (isCacheable) setCachedData(cacheKey, result);
            return result;
          }
        } catch { /* fall through */ }
      }
    }

    if (isCacheable) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.warn(`[API] Serving offline cache for ${endpoint}`);
        return cached;
      }
    }
    console.error('[API] Fatal Error:', error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export function unwrapApiResponse(payload: any): any {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload.data;
  }
  return payload;
}
