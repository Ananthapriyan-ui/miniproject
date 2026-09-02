/**
 * CloudVuln API Client
 * - Auto-injects Authorization header
 * - Auto-refreshes expired access tokens using refresh token
 * - In-memory response caching with TTL
 * - XSS prevention: all params URL-encoded
 *
 * IMPORTANT: Do NOT set VITE_API_URL in Vercel environment variables.
 * The vercel.json rewrite rule proxies all /api/* calls to Render automatically.
 * Setting VITE_API_URL would cause direct cross-origin requests which fail due to CORS/cold-starts.
 */

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

// ─── Token management ─────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('cloudvuln_token');
}

function getRefreshToken() {
  return localStorage.getItem('cloudvuln_refresh_token');
}

function setTokens(access, refresh) {
  localStorage.setItem('cloudvuln_token', access);
  if (refresh) localStorage.setItem('cloudvuln_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('cloudvuln_token');
  localStorage.removeItem('cloudvuln_refresh_token');
}

// ─── Token refresh flow ───────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
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

  const makeRequest = async (token) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  };

  let token = getToken();
  let response = await makeRequest(token);

  // If 401, attempt token refresh once
  if (response.status === 401 && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        token = await tryRefreshToken();
        onTokenRefreshed(token);
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh
      await new Promise((resolve) => refreshSubscribers.push(resolve));
      token = getToken();
    }
    response = await makeRequest(token);
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
  // Auth
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, full_name, role) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role }),
    }),

  refresh: () =>
    apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
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

  health: () => apiFetch('/health', {}, false),
};

export { setTokens, clearTokens, getToken, getRefreshToken };
export default api;
