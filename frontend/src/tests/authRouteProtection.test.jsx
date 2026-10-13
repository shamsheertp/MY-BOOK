import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStorage } from '../services/api';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Verifying session...</div>;
  if (!isAuthenticated) return <div>Redirected to Login</div>;
  return <div>Protected Dashboard Content</div>;
}

describe('Authentication Route Protection & Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears and retrieves tokens accurately without auto-login side-effects', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();

    tokenStorage.setAccessToken('sample-access-token');
    tokenStorage.setRefreshToken('sample-refresh-token');

    expect(tokenStorage.getAccessToken()).toBe('sample-access-token');
    expect(tokenStorage.getRefreshToken()).toBe('sample-refresh-token');

    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('renders unauthenticated state when no token is in storage', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<TestProtectedComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Initial loading or unauthenticated state
    const element = await screen.findByText('Redirected to Login');
    expect(element).toBeDefined();
  });

  it('resets authentication when auth:session-expired event is dispatched', async () => {
    tokenStorage.setAccessToken('dummy-token');
    localStorage.setItem('mybook_user_cache', JSON.stringify({ id: 'u1', name: 'Test' }));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<TestProtectedComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Dispatch global session expired event
    window.dispatchEvent(new CustomEvent('auth:session-expired'));

    const element = await screen.findByText('Redirected to Login');
    expect(element).toBeDefined();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
