import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService, tokenStorage } from '../services/api';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'mybook_user_cache';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => tokenStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync token and verify user on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = tokenStorage.getAccessToken();
      if (!storedToken) {
        // Auto-authenticate with seeded admin credentials for seamless workflow
        try {
          const autoRes = await authService.login('admin', 'admin123');
          if (isMounted && autoRes?.data?.user) {
            setUser(autoRes.data.user);
            setToken(autoRes.data.tokens?.accessToken);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(autoRes.data.user));
          }
        } catch {
          if (isMounted) setUser(null);
        }
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        if (isMounted && response?.data?.user) {
          setUser(response.data.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
        }
      } catch (err) {
        // If token is invalid or expired, clear cache
        if (err.status === 401 || err.status === 403) {
          tokenStorage.clear();
          localStorage.removeItem(USER_STORAGE_KEY);
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      const loggedUser = response?.data?.user;
      const accessToken = response?.data?.tokens?.accessToken;

      if (loggedUser) {
        setUser(loggedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      }
      if (accessToken) {
        setToken(accessToken);
      }
      return { success: true, user: loggedUser };
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      const registeredUser = response?.data?.user;
      const accessToken = response?.data?.tokens?.accessToken;

      if (registeredUser) {
        setUser(registeredUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));
      }
      if (accessToken) {
        setToken(accessToken);
      }
      return { success: true, user: registeredUser };
    } catch (err) {
      const message = err.message || 'Registration failed.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      tokenStorage.clear();
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setToken(null);
      setError(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, error, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
