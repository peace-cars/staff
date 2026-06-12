const CACHE_PREFIX = 'peace_staff_cache_';
import { unwrapApiResponse } from './api';
const CACHE_TTL_24H = 24 * 60 * 60 * 1000; // 24 hours — persistent offline cache
const CACHE_TTL_DEFAULT = 30 * 1000; // 30s in-memory default

// === L1: In-Memory Cache (ultra fast, session-scoped) ===
const memStore: Record<string, { data: any; timestamp: number }> = {};

// === L2: localStorage Cache (persistent, 24h offline support) ===
function lsGet(key: string): { data: any; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lsSet(key: string, data: any): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e: any) {
    // If storage quota exceeded, clear oldest entries first
    if (e?.name === 'QuotaExceededError') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      // Remove oldest 30%
      const toRemove = keys.slice(0, Math.ceil(keys.length * 0.3));
      toRemove.forEach(k => localStorage.removeItem(k));
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch { /* silent fail */ }
    }
  }
}

export const apiCache = {
  /**
   * Get cached data. Checks memory (L1) first, then localStorage (L2).
   * @param key Cache key
   * @param ttl Time-to-live in ms. Defaults to 30s for memory. 
   *            localStorage data is always served regardless of age for offline support.
   */
  get: (key: string, ttl: number = CACHE_TTL_DEFAULT): any | null => {
    // L1: memory
    const mem = memStore[key];
    if (mem && Date.now() - mem.timestamp < ttl) {
      return mem.data;
    }
    // L2: localStorage (serve stale for offline — max 24h)
    const ls = lsGet(key);
    if (ls && Date.now() - ls.timestamp < CACHE_TTL_24H) {
      // Promote to memory
      memStore[key] = ls;
      return ls.data;
    }
    return null;
  },

  set: (key: string, data: any): void => {
    const entry = { data, timestamp: Date.now() };
    memStore[key] = entry;
    lsSet(key, data);
  },

  clear: (key?: string): void => {
    if (key) {
      delete memStore[key];
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      Object.keys(memStore).forEach(k => delete memStore[k]);
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  },

  /** Get data from cache regardless of TTL (offline fallback) */
  getOffline: (key: string): any | null => {
    const mem = memStore[key];
    if (mem) return mem.data;
    const ls = lsGet(key);
    return ls?.data ?? null;
  }
};

/**
 * Stale-While-Revalidate fetcher with 2-layer persistent cache.
 * 1. Instantly returns cached data (from memory or localStorage) — no flicker.
 * 2. Fetches fresh data in background silently.
 * 3. Only re-triggers onData if data actually changed.
 * 4. On network failure, serves stale data gracefully.
 */
export async function fetchWithCache(
  url: string,
  options: RequestInit = {},
  onData: (data: any) => void,
  ttl: number = 24 * 60 * 60 * 1000 // 24h default TTL for freshness check
) {
  const cacheKey = `${url}_${options.method || 'GET'}_${JSON.stringify(options.body || '')}`;

  // 1. Serve cached data immediately (SWR: stale-while-revalidate)
  const cached = apiCache.get(cacheKey, ttl);
  if (cached !== null) {
    onData(cached);
  }

  // 2. Fetch fresh data in background
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    const freshData = unwrapApiResponse(await res.json());

    // 3. Only update UI if data actually changed (prevents unnecessary re-renders)
    const cachedStr = cached ? JSON.stringify(cached) : null;
    const freshStr = JSON.stringify(freshData);

    if (cachedStr !== freshStr) {
      apiCache.set(cacheKey, freshData);
      onData(freshData);
    }
    return freshData;
  } catch (err: any) {
    console.warn(`[Cache SWR] Revalidation failed for ${url}:`, err?.message || err);
    // Fallback: serve stale data even beyond TTL for offline support
    if (cached === null) {
      const offline = apiCache.getOffline(cacheKey);
      if (offline !== null) {
        console.info(`[Cache SWR] Serving offline data for ${url}`);
        onData(offline);
      }
    }
    throw err;
  }
}
