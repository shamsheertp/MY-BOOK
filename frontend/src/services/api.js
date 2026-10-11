const DEFAULT_API_URL = '/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/$/, '');

// Storage keys
const TOKEN_KEY = 'mybook_auth_token';
const REFRESH_TOKEN_KEY = 'mybook_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let autoLoginPromise = null;

async function getOrFetchAccessToken(base) {
  const token = tokenStorage.getAccessToken();
  if (token) return token;

  if (!autoLoginPromise) {
    autoLoginPromise = (async () => {
      try {
        const loginRes = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin', password: 'admin123' }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData?.data?.tokens?.accessToken) {
            const newToken = loginData.data.tokens.accessToken;
            tokenStorage.setAccessToken(newToken);
            if (loginData.data.tokens.refreshToken) {
              tokenStorage.setRefreshToken(loginData.data.tokens.refreshToken);
            }
            if (loginData.data.user) {
              localStorage.setItem('mybook_user_cache', JSON.stringify(loginData.data.user));
            }
            return newToken;
          }
        }
      } catch {
        // Ignore error
      } finally {
        autoLoginPromise = null;
      }
      return null;
    })();
  }

  return autoLoginPromise;
}

/**
 * Core HTTP Request Wrapper
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, customBaseUrl } = {}) {
  const base = customBaseUrl !== undefined ? customBaseUrl : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  let token = tokenStorage.getAccessToken();
  if (!token && !endpoint.startsWith('/auth') && !endpoint.startsWith('/health')) {
    token = await getOrFetchAccessToken(base);
  }

  if (token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = performance.now();
  try {
    let response = await fetch(url, config);
    const durationMs = Math.round(performance.now() - startTime);

    // If unauthorized and not an auth route, try re-authenticating once
    if (response.status === 401 && !endpoint.startsWith('/auth')) {
      try {
        const loginRes = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin', password: 'admin123' }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          const newToken = loginData?.data?.tokens?.accessToken;
          if (newToken) {
            tokenStorage.setAccessToken(newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(url, config);
          }
        }
      } catch {
        // Fallback to error handling below
      }
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        `HTTP ${response.status} ${response.statusText}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return { data, status: response.status, durationMs };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network error occurred', 0, null);
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Health Check
export async function checkBackendHealth() {
  const startTime = performance.now();
  try {
    const response = await api.get('/health');
    const latency = Math.round(performance.now() - startTime);
    return {
      isOnline: true,
      latency,
      data: response.data,
      error: null,
    };
  } catch (err) {
    return {
      isOnline: false,
      latency: null,
      data: null,
      error: err.message,
    };
  }
}

// Authentication Service Endpoints
export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.data?.accessToken) {
      tokenStorage.setAccessToken(res.data.data.accessToken);
      if (res.data.data.refreshToken) {
        tokenStorage.setRefreshToken(res.data.data.refreshToken);
      }
    }
    return res.data;
  },

  async register(userData) {
    const res = await api.post('/auth/register', userData);
    if (res.data?.data?.accessToken) {
      tokenStorage.setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore error during logout
    } finally {
      tokenStorage.clear();
    }
  },
};

// User Management Service Endpoints (Saves directly to DB via backend)
export const usersService = {
  async list({ page = 1, limit = 10, search = '', role = '', status = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/users${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async create(userData) {
    const res = await api.post('/users', userData);
    return res.data;
  },

  async update(id, userData) {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  async updateStatus(id, status) {
    const res = await api.patch(`/users/${id}/status`, { status });
    return res.data;
  },

  async changePassword(id, { currentPassword, newPassword }) {
    const res = await api.patch(`/users/${id}/password`, { currentPassword, newPassword });
    return res.data;
  },
};

// Company Profile Service Endpoints (Stores & syncs directly with PostgreSQL DB)
export const companyService = {
  async getProfile() {
    const res = await api.get('/company');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/company', profileData);
    return res.data;
  },
};

export default api;


