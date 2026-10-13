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

let refreshPromise = null;

export async function refreshAccessToken(base = API_BASE_URL) {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshRes = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const resData = await refreshRes.json();
          const payload = resData?.data;
          const newAccessToken = payload?.tokens?.accessToken || payload?.accessToken;
          const newRefreshToken = payload?.tokens?.refreshToken || payload?.refreshToken;
          if (newAccessToken) {
            tokenStorage.setAccessToken(newAccessToken);
            if (newRefreshToken) {
              tokenStorage.setRefreshToken(newRefreshToken);
            }
            return newAccessToken;
          }
        }
        // If refresh failed, clear invalid tokens and dispatch session expired event
        tokenStorage.clear();
        localStorage.removeItem('mybook_user_cache');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return null;
      } catch {
        tokenStorage.clear();
        localStorage.removeItem('mybook_user_cache');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/**
 * Core HTTP Request Wrapper
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, customBaseUrl } = {}) {
  const base = customBaseUrl !== undefined ? customBaseUrl : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  const nonRefreshableEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isAuthEntryRoute = nonRefreshableEndpoints.some((ep) => endpoint.startsWith(ep));

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  let token = tokenStorage.getAccessToken();
  // If accessToken is missing but refreshToken is present, attempt proactive refresh
  if (!token && tokenStorage.getRefreshToken() && !isAuthEntryRoute) {
    token = await refreshAccessToken(base);
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

    // If unauthorized and not an auth entry route, try refreshing the token once
    if (response.status === 401 && !isAuthEntryRoute) {
      const refreshedToken = await refreshAccessToken(base);
      if (refreshedToken) {
        config.headers.Authorization = `Bearer ${refreshedToken}`;
        response = await fetch(url, config);
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
    if (error instanceof ApiError || (error && typeof error.status === 'number')) throw error;
    throw new ApiError(error?.message || 'Network error occurred', 0, null);
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
    const payload = res.data?.data;
    const accessToken = payload?.tokens?.accessToken || payload?.accessToken;
    const refreshToken = payload?.tokens?.refreshToken || payload?.refreshToken;
    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
    }
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
    }
    return res.data;
  },

  async register(userData) {
    const res = await api.post('/auth/register', userData);
    const payload = res.data?.data;
    const accessToken = payload?.tokens?.accessToken || payload?.accessToken;
    const refreshToken = payload?.tokens?.refreshToken || payload?.refreshToken;
    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
    }
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
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
      localStorage.removeItem('mybook_user_cache');
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

// Contacts Service Endpoints (Stores & syncs directly with PostgreSQL DB)
export const contactsService = {
  async list({ page = 1, limit = 50, search = '', hasOutstanding = false } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (hasOutstanding) params.append('hasOutstanding', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/contacts${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/contacts/${id}`);
    return res.data;
  },

  async create(contactData) {
    const res = await api.post('/contacts', contactData);
    return res.data;
  },

  async update(id, contactData) {
    const res = await api.put(`/contacts/${id}`, contactData);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/contacts/${id}`);
    return res.data;
  },
};

// Products Service Endpoints (Stores & syncs directly with PostgreSQL DB)
export const productsService = {
  async list({ page = 1, limit = 50, search = '', category = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'All') params.append('status', status);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/products${query}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/products/categories');
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  async create(productData) {
    const res = await api.post('/products', productData);
    return res.data;
  },

  async update(id, productData) {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },

  async adjustStock(id, { type, quantityKg, notes }) {
    const res = await api.post(`/products/${id}/adjust-stock`, { type, quantityKg, notes });
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};

// Sales Service Endpoints (Stores & syncs directly with PostgreSQL DB)
export const salesService = {
  async list({ page = 1, limit = 50, search = '', status = '', customerId = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status.toUpperCase());
    if (customerId) params.append('customerId', customerId);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/sales${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/sales/${id}`);
    return res.data;
  },

  async create(saleData) {
    const res = await api.post('/sales', saleData);
    return res.data;
  },

  async recordPayment(id, paymentData) {
    const res = await api.post(`/sales/${id}/payments`, paymentData);
    return res.data;
  },

  async voidPayment(id, paymentId) {
    const res = await api.post(`/sales/${id}/payments/${paymentId}/void`);
    return res.data;
  },

  async void(id, reasonData = {}) {
    const res = await api.post(`/sales/${id}/void`, reasonData);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/sales/${id}`);
    return res.data;
  },
};

// Purchases Service Endpoints (Stores & syncs directly with PostgreSQL DB)
export const purchasesService = {
  async list({ page = 1, limit = 50, search = '', status = '', supplierId = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status.toUpperCase());
    if (supplierId) params.append('supplierId', supplierId);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/purchases${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/purchases/${id}`);
    return res.data;
  },

  async create(purchaseData) {
    const res = await api.post('/purchases', purchaseData);
    return res.data;
  },

  async createReceipt(id, receiptData) {
    const res = await api.post(`/purchases/${id}/receipts`, receiptData);
    return res.data;
  },

  async voidReceipt(id, receiptId) {
    const res = await api.post(`/purchases/${id}/receipts/${receiptId}/void`);
    return res.data;
  },

  async createBill(id, billData) {
    const res = await api.post(`/purchases/${id}/bills`, billData);
    return res.data;
  },

  async voidBill(id, billId) {
    const res = await api.post(`/purchases/${id}/bills/${billId}/void`);
    return res.data;
  },

  async recordPayment(id, paymentData) {
    const res = await api.post(`/purchases/${id}/payments`, paymentData);
    return res.data;
  },

  async voidPayment(id, paymentId) {
    const res = await api.post(`/purchases/${id}/payments/${paymentId}/void`);
    return res.data;
  },

  async void(id, reasonData = {}) {
    const res = await api.post(`/purchases/${id}/void`, reasonData);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/purchases/${id}`);
    return res.data;
  },
};

export default api;


