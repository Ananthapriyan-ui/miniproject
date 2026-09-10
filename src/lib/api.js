/**
 * CloudVuln API Client
 * - Auto-injects Authorization header (reads JWT from Supabase session)
 * - In-memory response caching with TTL
 * - XSS prevention: all params URL-encoded
 *
 * Auth is now handled by Supabase. The Supabase access token is forwarded
 * to the Python backend as a Bearer token so it can verify the user.
 *
 * IMPORTANT: Do NOT set VITE_API_URL in Vercel environment variables.
 * The vercel.json rewrite rule proxies all /api/* calls to Render automatically.
 * Setting VITE_API_URL would cause direct cross-origin requests which fail due to CORS/cold-starts.
 */

import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CACHE_TTL_MS = 30_000; // 30 seconds default


// ─── Simple in-memory cache ───────────────────────────────────────
const cache = new Map();

function getCacheKey(url, options = {}) {
  return `${options.method || 'GET'}::${url}`;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (!pattern || key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// ─── Token retrieval (Supabase-aware) ────────────────────────────
/**
 * Returns the current access token.
 * - If demo mode: returns the stored legacy demo token string.
 * - Otherwise: reads the live JWT from the Supabase session.
 */
async function getAccessToken() {
  // Demo mode fallback
  if (localStorage.getItem('cloudvuln_demo') === '1') {
    return 'demo_token_secops_lead';
  }

  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// ─── Core fetch wrapper ───────────────────────────────────────────
async function apiFetch(endpoint, options = {}, useCache = false, cacheTtl = CACHE_TTL_MS) {
  const url = `${BASE_URL}${endpoint}`;
  const cacheKey = getCacheKey(url, options);

  // Cache check (GET only)
  if (useCache && (!options.method || options.method === 'GET')) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  // If Supabase session expired mid-request, attempt a silent refresh and retry once
  if (response.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${refreshed.session.access_token}`,
      };
      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: 'same-origin',
      });
      if (!retryResponse.ok) {
        const errData = await retryResponse.json().catch(() => ({}));
        throw new Error(errData.message || errData.detail || `Request failed with status ${retryResponse.status}`);
      }
      const retryData = await retryResponse.json().catch(() => retryResponse.text());
      if (useCache && (!options.method || options.method === 'GET')) {
        setCache(cacheKey, retryData, cacheTtl);
      }
      return retryData;
    }
    // Session truly expired — let Supabase onAuthStateChange handle the redirect
    throw new Error('Session expired. Please sign in again.');
  }

  // Parse response
  const contentType = response.headers.get('Content-Type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && (data.message || data.detail)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  // Store in cache
  if (useCache && (!options.method || options.method === 'GET')) {
    setCache(cacheKey, data, cacheTtl);
  }

  return data;
}

// ─── Public API methods ───────────────────────────────────────────

export const api = {
  // Auth — these still proxy to Python for backwards-compat (e.g. demo mode)
  // Real auth now goes through Supabase directly via AuthContext
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, full_name) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  me: () => apiFetch('/auth/me', {}, true, 60_000),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  // Dashboard
  dashboardSummary: () =>
    apiFetch('/dashboard/summary', {}, true, 30_000),

  riskStatistics: () =>
    apiFetch('/dashboard/risk-statistics', {}, true, 30_000),

  recentScans: () =>
    apiFetch('/dashboard/recent-scans', {}, true, 15_000),

  activity: () =>
    apiFetch('/dashboard/activity', {}, true, 15_000),

  // Scans
  getScans: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, String(v));
      }
    });
    const queryString = qs.toString();
    return apiFetch(`/scans${queryString ? `?${queryString}` : ''}`, {}, false);
  },

  getScan: (scanRef) => apiFetch(`/scans/${encodeURIComponent(scanRef)}`, {}, true, 60_000),

  createScan: (data) => {
    invalidateCache('/scans');
    invalidateCache('/dashboard');
    return apiFetch('/scans', { method: 'POST', body: JSON.stringify(data) });
  },

  deleteScan: (scanRef) => {
    invalidateCache('/scans');
    invalidateCache('/dashboard');
    return apiFetch(`/scans/${encodeURIComponent(scanRef)}`, { method: 'DELETE' });
  },

  // Analysis
  analyzeTarget: (targetUrl) =>
    apiFetch('/analysis/target', {
      method: 'POST',
      body: JSON.stringify({ target_url: targetUrl }),
    }),

  searchCve: (query) =>
    apiFetch(`/cve/search?query=${encodeURIComponent(query)}`, {}, true, 120_000),

  whoisLookup: (domain) =>
    apiFetch(`/whois/lookup?domain=${encodeURIComponent(domain)}`, {}, true, 120_000),

  analyzeOwasp: (targetUrl) =>
    apiFetch('/analysis/owasp', {
      method: 'POST',
      body: JSON.stringify({ target_url: targetUrl }),
    }),

  // Reports
  getReports: () => apiFetch('/reports', {}, false),
  getReport: (scanRef) => apiFetch(`/reports/${encodeURIComponent(scanRef)}`, {}, false),
  getReportHtmlUrl: (scanRef) => `/api/reports/${encodeURIComponent(scanRef)}/html`,
  getReportDownloadUrl: (scanRef, format = 'html') =>
    `/api/reports/${encodeURIComponent(scanRef)}/download?format=${format}`,

  // Scan Comparison & Security Trends
  getComparisonOptions: () => apiFetch('/scans/comparison-options', {}, false),
  compareScans: (prevRef, latestRef) =>
    apiFetch(`/scans/compare/${encodeURIComponent(prevRef)}/${encodeURIComponent(latestRef)}`, {}, false),
  getScanTrend: (target) =>
    apiFetch(`/scans/trend${target ? `?target=${encodeURIComponent(target)}` : ''}`, {}, false),
  getComparisonDownloadUrl: (prevRef, latestRef, format = 'html') =>
    `/api/scans/compare/${encodeURIComponent(prevRef)}/${encodeURIComponent(latestRef)}/download?format=${format}`,

  health: () => apiFetch('/health', {}, false),
};

export function formatScanDate(dateStr) {
  if (!dateStr) return '—';
  try {
    // If dateStr contains 'UTC' or ends with 'Z', parse standard ISO
    let clean = String(dateStr).trim();
    if (clean.includes(' UTC')) {
      clean = clean.replace(' UTC', 'Z').replace(' ', 'T');
    } else if (!clean.includes('Z') && !clean.includes('+') && !clean.includes('T')) {
      clean = clean.replace(' ', 'T') + 'Z';
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return dateStr;

    // Format to: DD MMM YYYY, hh:mm A
    const day = String(d.getUTCDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    
    let hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${hourStr}:${minutes} ${ampm} UTC`;
  } catch {
    return dateStr;
  }
}

// ─── Legacy token helpers (kept for compatibility) ────────────────
// These are no-ops now — Supabase manages the session internally.
export function setTokens() {}
export function clearTokens() { localStorage.removeItem('cloudvuln_demo'); }
export function getToken() { return localStorage.getItem('cloudvuln_demo') === '1' ? 'demo_token_secops_lead' : null; }
export function getRefreshToken() { return null; }

export default api;
