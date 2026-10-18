const DEFAULT_API_URL = '/api';

export const API_BASE_URL = (() => {
  const raw = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
  if (!raw || raw === '/api') return '/api';
  // If user entered a domain like my-book-production-f98b.up.railway.app/api without https://
  if (!raw.startsWith('/') && !/^https?:\/\//i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
})();

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

// High-performance In-Memory Request Cache and Deduplication Map
const apiCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL_MS = 25000; // 25 seconds cache lifetime for instant navigation

/**
 * Clear or invalidate in-memory cache
 */
export function clearApiCache(prefix = '') {
  if (!prefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(prefix)) {
        apiCache.delete(key);
      }
    }
  }
}

/**
 * Core HTTP Request Wrapper with intelligent caching and request deduplication
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, customBaseUrl, bypassCache = false } = {}) {
  const base = customBaseUrl !== undefined ? customBaseUrl : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  const isGet = method.toUpperCase() === 'GET';
  const cacheKey = `${method.toUpperCase()}:${url}`;

  // 1. Check in-memory cache for instant 0ms responses on section switching
  if (isGet && !bypassCache && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    const age = Date.now() - cached.timestamp;
    if (age < DEFAULT_CACHE_TTL_MS) {
      return { data: cached.data, status: cached.status, durationMs: 0, fromCache: true };
    }
  }

  // 2. Request deduplication: if identical GET is already in-flight, reuse promise
  if (isGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const executeRequest = async () => {
    const nonRefreshableEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isAuthEntryRoute = nonRefreshableEndpoints.some((ep) => endpoint.startsWith(ep));

    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let token = tokenStorage.getAccessToken();
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

      // Store in memory cache for instant future loads
      if (isGet) {
        apiCache.set(cacheKey, {
          data,
          status: response.status,
          timestamp: Date.now(),
        });
      } else {
        // Mutation occurred (create/update/delete/void): invalidate cache so user immediately sees fresh state
        clearApiCache();
      }

      return { data, status: response.status, durationMs };
    } catch (error) {
      if (error instanceof ApiError || (error && typeof error.status === 'number')) throw error;
      throw new ApiError(error?.message || 'Network error occurred', 0, null);
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  if (isGet) {
    const promise = executeRequest();
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeRequest();
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

  async getTransactions(id) {
    const res = await api.get(`/contacts/${id}/transactions`);
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

  async uploadPaymentProof(saleId, paymentId, file) {
    // 1. Upload to Cloudflare R2
    const uploadRes = await uploadService.uploadFile(file, 'payments');
    const fileUrl = uploadRes?.data?.url;
    if (!fileUrl) throw new Error('Document upload to storage failed');

    // 2. Attach proof URL to database payment record
    const res = await api.patch(`/sales/${saleId}/payments/${paymentId}/proof`, { image: fileUrl });
    return { ...res.data, url: fileUrl };
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
    clearApiCache('products');
    clearApiCache('purchases');
    return res.data;
  },

  async update(id, purchaseData) {
    const res = await api.put(`/purchases/${id}`, purchaseData);
    clearApiCache('products');
    clearApiCache('purchases');
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

// Expenses Service Endpoints (Saves directly to DB via backend)
export const expensesService = {
  async list({
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'date',
    sortOrder = 'desc',
  } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'All') params.append('status', status);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/expenses${query}`);
    return res.data;
  },

  async getSummary(year) {
    const query = year ? `?year=${year}` : '';
    const res = await api.get(`/expenses/summary${query}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/expenses/categories');
    return res.data;
  },

  async createCategory(categoryData) {
    const res = await api.post('/expenses/categories', categoryData);
    return res.data;
  },

  async updateCategory(id, categoryData) {
    const res = await api.put(`/expenses/categories/${id}`, categoryData);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/expenses/categories/${id}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/expenses/${id}`);
    return res.data;
  },

  async create(expenseData) {
    const res = await api.post('/expenses', expenseData);
    return res.data;
  },

  async update(id, expenseData) {
    const res = await api.put(`/expenses/${id}`, expenseData);
    return res.data;
  },

  async void(id, voidData = {}) {
    const res = await api.post(`/expenses/${id}/void`, voidData);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
};

// Payment Methods Service (DB saved and customizable in Settings)
export const paymentMethodsService = {
  async getAll() {
    const res = await api.get('/payment-methods');
    return res.data;
  },

  async create(data) {
    const res = await api.post('/payment-methods', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/payment-methods/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/payment-methods/${id}`);
    return res.data;
  },
};

// Journals Service (Double-entry accounting, live DB)
export const journalsService = {
  async list({ page = 1, limit = 50, search = '', status = '', dateFrom = '', dateTo = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status.toUpperCase());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/journals${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/journals/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/journals', data);
    return res.data;
  },

  async void(id, voidData = {}) {
    const res = await api.post(`/journals/${id}/void`, voidData);
    return res.data;
  },
};

// General Ledger Service (Live chart of accounts & running balances)
export const ledgersService = {
  async getAccounts() {
    const res = await api.get('/ledgers/accounts');
    return res.data;
  },

  async getAccountDetails(code) {
    const res = await api.get(`/ledgers/accounts/${code}`);
    return res.data;
  },
};

// Financial Reports Service (Live P&L, Sales & Expenses Statements)
export const reportsService = {
  async getProfitAndLoss({ dateFrom = '', dateTo = '', year = '' } = {}) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (year) params.append('year', year);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/reports/profit-and-loss${query}`);
    return res.data;
  },
};

// Document & Attachment Upload Service (Cloudflare R2 / S3)
export const uploadService = {
  async uploadFile(file, { folder = 'documents' } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const base = API_BASE_URL;
    const token = tokenStorage.getAccessToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${base}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message || 'File upload failed', res.status, data);
    }
    return data;
  },

  async getStatus() {
    const res = await api.get('/upload/status');
    return res.data;
  },
};

export default api;


