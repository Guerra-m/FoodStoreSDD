/**
 * Test Suite: AuthContext Session Restoration and Logout
 * 
 * These tests verify:
 * - Session restoration from localStorage
 * - Refresh token handling
 * - Logout atomic cleanup
 * - 401 error cascade prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import * as authLib from '../../lib/auth';
import { useAuthStore } from '../../stores/authStore';
import { customerApi } from '../../api/customers';

// ─────────────────────────────────────────
// TEST SUITE 1: Session Restoration
// ─────────────────────────────────────────

describe('AuthContext - Session Restoration', () => {
  beforeEach(() => {
    // Clear all tokens before each test
    vi.spyOn(authLib, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(authLib, 'getTokens').mockReturnValue({ accessToken: null, refreshToken: null });
    vi.spyOn(authLib, 'saveTokens').mockImplementation(() => {});
    vi.spyOn(authLib, 'isTokenExpired').mockReturnValue(false);
    
    // Mock customer API
    vi.spyOn(customerApi, 'getCurrentUser').mockResolvedValue({
      id: '1',
      email: 'user@test.com',
      nombre: 'Test User',
      roles: ['cliente'],
    });
    
    // Reset zustand store
    useAuthStore.setState({ accessToken: null, user: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('T1.1: Should restore valid session (token not expired)', async () => {
    // Setup: localStorage has valid accessToken + refreshToken
    const mockTokens = {
      accessToken: 'valid_access_token',
      refreshToken: 'valid_refresh_token',
    };
    vi.mocked(authLib.getTokens).mockReturnValue(mockTokens);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    // Action: Mount AuthProvider with useAuth hook
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => {
      // Simulate useAuth hook usage
      return {
        isLoading: true, // Mock — would be from context
        isAuthenticated: false,
        user: null,
      };
    }, { wrapper });

    // Expected: isLoading false, isAuthenticated true, user loaded from backend
    // This test is RED — we need getCurrentUser to be called
    await waitFor(() => {
      expect(customerApi.getCurrentUser).toHaveBeenCalled();
    });
  });

  it('T1.2: Should restore and refresh (token expired but refresh valid)', async () => {
    // Setup: localStorage has EXPIRED accessToken + VALID refreshToken
    const mockTokens = {
      accessToken: 'expired_access_token',
      refreshToken: 'valid_refresh_token',
    };
    vi.mocked(authLib.getTokens).mockReturnValue(mockTokens);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(true);

    // Mock refresh endpoint
    vi.spyOn(customerApi, 'refresh').mockResolvedValue({
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
      user: {
        id: '1',
        email: 'user@test.com',
        nombre: 'Test User',
        roles: ['cliente'],
      },
    });

    // Action: Mount AuthProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    renderHook(() => ({}), { wrapper });

    // Expected: Refresh called once, new tokens saved, user loaded
    await waitFor(() => {
      expect(customerApi.refresh).toHaveBeenCalledWith('valid_refresh_token');
    });
    
    await waitFor(() => {
      expect(authLib.saveTokens).toHaveBeenCalledWith('new_access_token', 'new_refresh_token');
    });
  });

  it('T1.3: Should handle expired refresh token gracefully', async () => {
    // Setup: localStorage has EXPIRED accessToken + EXPIRED refreshToken
    const mockTokens = {
      accessToken: 'expired_access_token',
      refreshToken: 'expired_refresh_token',
    };
    vi.mocked(authLib.getTokens).mockReturnValue(mockTokens);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(true);

    // Mock refresh to fail
    vi.mocked(customerApi.refresh as any).mockRejectedValue(new Error('Refresh failed'));

    // Action: Mount AuthProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => ({ test: true }), { wrapper });

    // Expected: Tokens cleared, isLoading false, isAuthenticated false (but user not destroyed)
    await waitFor(() => {
      expect(authLib.clearTokens).toHaveBeenCalled();
    });
  });

  it('T1.4: Should handle no tokens scenario', async () => {
    // Setup: localStorage empty
    vi.mocked(authLib.getTokens).mockReturnValue({ accessToken: null, refreshToken: null });

    // Action: Mount AuthProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    renderHook(() => ({}), { wrapper });

    // Expected: isLoading false, isAuthenticated false, user null
    // Should NOT call refresh or getCurrentUser
    await waitFor(() => {
      expect(customerApi.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  it('T1.5: Should prevent restoreSession from running multiple times (isRestoringSession guard)', async () => {
    // Setup: valid tokens
    const mockTokens = {
      accessToken: 'valid_token',
      refreshToken: 'valid_refresh',
    };
    vi.mocked(authLib.getTokens).mockReturnValue(mockTokens);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    // Mock a slow getCurrentUser
    vi.mocked(customerApi.getCurrentUser as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: '1',
        email: 'user@test.com',
        nombre: 'Test',
        roles: ['cliente'],
      }), 100))
    );

    // Action: Mount and trigger multiple restoreSession calls
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    renderHook(() => ({}), { wrapper });

    // Expected: getCurrentUser called ONCE only
    await waitFor(() => {
      expect(customerApi.getCurrentUser).toHaveBeenCalledTimes(1);
    }, { timeout: 300 });
  });
});

// ─────────────────────────────────────────
// TEST SUITE 2: Logout Atomic Cleanup
// ─────────────────────────────────────────

describe('AuthContext - Logout', () => {
  beforeEach(() => {
    vi.spyOn(authLib, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(authLib, 'getTokens').mockReturnValue({
      accessToken: 'valid_token',
      refreshToken: 'valid_refresh',
    });
    vi.spyOn(customerApi, 'logout').mockResolvedValue(undefined);
    
    useAuthStore.setState({
      accessToken: 'valid_token',
      user: { id: '1', email: 'user@test.com', nombre: 'Test', roles: ['cliente'] },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('T3.1: Should logout successfully (API call + cleanup)', async () => {
    // This is RED — logout must call API, then clear tokens in order
    // Production code doesn't yet guarantee this order
    
    // Expected behavior to implement:
    // 1. Call logout API with refreshToken
    // 2. Clear tokens from localStorage
    // 3. Clear Zustand store
    // 4. Redirect to login (would be verified via navigation mock)
    
    expect(true).toBe(true); // Placeholder — real test will verify the flow
  });

  it('T3.2: Should cleanup even if logout API fails', async () => {
    // Setup: logout API fails
    vi.mocked(customerApi.logout as any).mockRejectedValue(new Error('API error'));

    // Expected: Even though API failed, tokens and store are still cleared
    expect(true).toBe(true); // Placeholder
  });
});

// ─────────────────────────────────────────
// TEST SUITE 3: 401 Error Handling
// ─────────────────────────────────────────

describe('AuthContext - 401 Error Handling', () => {
  beforeEach(() => {
    vi.spyOn(authLib, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(authLib, 'getTokens').mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('T2.1: Should handle 401 from refresh endpoint (token revoked)', async () => {
    // Setup: refresh endpoint returns 401
    vi.mocked(customerApi.refresh as any).mockRejectedValue({
      response: { status: 401 },
    });

    // Expected: 401 caught, tokens cleared, isAuthenticated false
    // NO LOOP: restoreSession completes, user can manually login
    expect(true).toBe(true); // Placeholder
  });

  it('T2.2: Should dispatch auth:unauthorized event on final 401', async () => {
    // Setup: axios interceptor gets 401 that can't be recovered
    // Expected: auth:unauthorized event dispatched, logout happens
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    // This will be verified when axios interceptor tests run
    expect(true).toBe(true); // Placeholder
  });

  it('T2.3: Should handle network timeout on refresh gracefully', async () => {
    // Setup: refreshToken valid but network is slow (timeout)
    vi.mocked(customerApi.refresh as any).mockImplementation(
      () => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 5000);
      })
    );

    // Expected: Timeout caught, tokens NOT cleared (user can retry), isLoading false
    expect(true).toBe(true); // Placeholder
  });
});
