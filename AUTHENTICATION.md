# AUTHENTICATION.md - Session Management and Token Refresh

## Overview

This guide documents the authentication flow and session management system for FoodStore, including how the critical session expiration loop was fixed.

## Problem Statement (Change 20: fix-session-loop)

**Symptom**: Users encountered continuous "Sesión expirada" errors with 401 Unauthorized responses, preventing navigation and causing infinite logout loops.

**Root Causes**:
1. **Multiple refresh calls**: When a 401 error occurred, `restoreSession()` could be called simultaneously with axios interceptor refresh, causing deadlock
2. **Incomplete logout**: Token clearing happened BEFORE logout API call, risking orphaned refresh tokens server-side
3. **Token source mismatch**: Both localStorage and Zustand had tokens that could fall out of sync
4. **No restore guard**: `restoreSession()` ran repeatedly without checking if one was already in progress

## Architecture

### 1. Single Source of Truth

- **Primary**: `localStorage` (via `lib/auth.ts` helpers: `getTokens()`, `saveTokens()`, `clearTokens()`)
- **Mirror**: Zustand `authStore` (synced from localStorage, read-only for most operations)
- **Why**: localStorage survives tab close; Zustand persist is synchronization layer only

### 2. Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP BOOT                                │
│    1. Zustand persist rehydrates from localStorage              │
│    2. AuthProvider mounts                                        │
│    3. restoreSession() runs ONCE (guarded by isRestoringSession)│
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────▼──────────────────┐
        │  Check isRestoringSession flag  │
        │  If true, SKIP (prevent loops) │
        │  If false, set to true         │
        └─────────────┬──────────────────┘
                      │
        ┌─────────────▼──────────────────────────────────────┐
        │  1. getTokens() from localStorage                  │
        │  2. Check if accessToken is expired               │
        │     YES → attempt refresh ONCE                    │
        │     NO  → verify with backend (/auth/me)          │
        │  3. Handle errors silently (no cascade)           │
        │  4. Set isRestoringSession = false                │
        └─────────────┬──────────────────────────────────────┘
                      │
     ┌────────────────▼──────────────────┐
     │  ProtectedRoute checks:            │
     │  - isLoading = false?              │
     │  - isRestoringSession = false?     │
     │  If both true, show spinner       │
     │  If authenticated, render content  │
     │  If not, redirect to /login        │
     └────────────────────────────────────┘
```

### 3. Token Lifecycle

```
LOGIN
  ↓
Backend returns: { access_token, refresh_token, user }
  ↓
saveTokens() → localStorage + Zustand
  ↓
ACCESS TOKEN (15 min)
  ├─ Included in: Authorization: Bearer {token}
  ├─ Validated by: backend JWT check
  └─ On expiry: axios interceptor triggers refresh
  
REFRESH TOKEN (7 days)
  ├─ Stored in: localStorage (opaque, never in HTTP header)
  ├─ Single use: backend rotates on refresh
  ├─ On 401 from /auth/refresh: user logs out
  └─ On revoke: tokens cleared, user redirected to login
```

## Key Implementation Details

### 1. AuthContext (`frontend/src/context/AuthContext.tsx`)

**NEW: Session Restoration Guard**
```typescript
// Prevent multiple simultaneous restores
if (useAuthStore.getState().isRestoringSession) {
  return;
}
useAuthStore.getState().setRestoringSession(true);

try {
  // restore logic
} finally {
  useAuthStore.getState().setRestoringSession(false);
}
```

**NEW: Atomic Logout**
```typescript
// Call logout API FIRST (revoke refresh token server-side)
if (refreshToken) {
  try {
    await customerApi.logout(refreshToken);
  } catch {
    // API failed, but continue to local cleanup
  }
}

// THEN clear everything locally (guaranteed cleanup)
clearAllAuth(); // tokens + store + context state
```

**NEW: Silent Error Handling**
```typescript
try {
  await handleRefreshToken();
} catch {
  // Silently fail — don't throw
  // axios interceptor will handle reactively
}
```

### 2. Axios Interceptor (`frontend/src/api/axios.ts`)

**NEW: Refresh Debounce with Timeout**
```typescript
let isRefreshing = false;
let refreshTimeoutId: NodeJS.Timeout | null = null;
let failedQueue = [];

// Timeout safeguard: 10 second maximum
const setRefreshTimeout = () => {
  refreshTimeoutId = setTimeout(() => {
    if (isRefreshing) {
      processQueue(new Error('Refresh timeout'), null);
      isRefreshing = false;
    }
  }, 10000);
};

// When 401 occurs:
if (isRefreshing) {
  // Already refreshing, queue this request
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then((token) => {
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  });
}

// Not refreshing yet, start refresh
isRefreshing = true;
setRefreshTimeout();

try {
  // Fetch new tokens
  const result = await customerApi.refresh(refreshToken);
  
  // Save and update
  saveTokens(result.access_token, result.refresh_token);
  useAuthStore.getState().setAuth(result.access_token, result.user);
  
  // Retry queued requests
  processQueue(null, result.access_token);
  
  // Retry original request
  originalRequest.headers.Authorization = `Bearer ${result.access_token}`;
  return api(originalRequest);
} catch (err) {
  // Refresh failed: logout and reject all
  processQueue(err, null);
  useAuthStore.getState().logout();
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  return Promise.reject(err);
} finally {
  clearRefreshTimeout();
  isRefreshing = false;
}
```

**DEADLOCK PREVENTION**
```typescript
// If the request that failed IS the refresh itself, don't queue it
if (originalRequest.url?.includes('/auth/refresh')) {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  return Promise.reject(error);
}
```

### 3. Auth Store (`frontend/src/stores/authStore.ts`)

**NEW: isRestoringSession Flag**
```typescript
interface AuthState {
  accessToken: string | null;
  user: User | null;
  isRestoringSession: boolean;
  setAuth: (token: string, user: User | null) => void;
  logout: () => void;
  setRestoringSession: (restoring: boolean) => void;
}

// Note: isRestoringSession is NOT persisted
// It resets on page reload (volatile, lifetime-only)
partialize: (state) => ({
  accessToken: state.accessToken,
  user: state.user
  // NOT isRestoringSession
})
```

### 4. ProtectedRoute (`frontend/src/components/auth/ProtectedRoute.tsx`)

**NEW: Loading Spinner During Restore**
```typescript
const { isLoading } = useAuth();
const isRestoringSession = useAuthStore((state) => state.isRestoringSession);

if (isLoading || isRestoringSession) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-600">Restaurando sesión...</p>
      </div>
    </div>
  );
}
```

## Error Scenarios & Handling

### Scenario 1: Valid Session, Token Not Expired

```
1. App boots → restoreSession() runs
2. getTokens() finds valid accessToken
3. isTokenExpired() returns false
4. Call /auth/me to verify
5. User object loaded, isLoading = false
Result: ✅ Session restored, user can navigate
```

### Scenario 2: Token Expired, Refresh Valid

```
1. App boots → restoreSession() runs
2. getTokens() finds EXPIRED accessToken
3. Call handleRefreshToken() → POST /auth/refresh
4. Backend validates refresh token (not expired)
5. Backend rotates: returns new access + new refresh tokens
6. saveTokens() updates localStorage
7. useAuthStore updated with new tokens
8. /auth/me call succeeds
Result: ✅ Session refreshed, user can navigate
```

### Scenario 3: Refresh Token Expired

```
1. App boots → restoreSession() runs
2. getTokens() finds EXPIRED accessToken
3. Call handleRefreshToken() → POST /auth/refresh
4. Backend finds refresh token is revoked/expired → 401
5. handleRefreshToken() throws
6. Catch block: silently fail (no token cleared yet)
7. isRestoringSession = false, isLoading = false
8. axios interceptor will handle on next user request
9. User redirected to /login
Result: ✅ User can manually login
```

### Scenario 4: Multiple 401s During Restore

```
1. User makes 3 API calls while restoreSession() running
2. All 3 get 401 (token expired)
3. First 401: axios sets isRefreshing=true, calls refresh
4. Requests 2-3: Check isRefreshing, are QUEUED
5. Refresh succeeds → new tokens saved
6. processQueue() retries requests 2-3 with new token
7. All succeed
Result: ✅ Debounce prevents 3 simultaneous refresh calls
```

### Scenario 5: Logout with API Failure

```
1. User clicks logout
2. logout() gets refreshToken from localStorage
3. Call customerApi.logout(refreshToken) → fails (500 error)
4. Catch block: continue (don't re-throw)
5. Finally block: clearAllAuth() runs regardless
   - clearTokens() clears localStorage
   - useAuthStore.logout() clears store
   - setUser(null) clears context
6. User redirected to /login
Result: ✅ Local cleanup guaranteed even if API fails
```

## Testing Checklist

- ✅ Session restoration from valid tokens
- ✅ Session refresh when token expired
- ✅ Logout with API failure still clears locally
- ✅ No infinite logout loops
- ✅ Debounced refresh (max 1 concurrent)
- ✅ ProtectedRoute shows spinner during restore
- ✅ 401 errors trigger cleanup, not cascade
- ✅ Cross-tab sync (via storage event listeners)
- ✅ Page reload during restore (safe re-entry)

## Debugging Tips

### Check Token Source

```javascript
// Browser console
const tokens = localStorage.getItem('food-store-auth');
console.log(JSON.parse(tokens)); // View current tokens
```

### Check Store State

```javascript
// Browser console
import { useAuthStore } from './stores/authStore';
console.log(useAuthStore.getState()); // View current auth state
```

### Trace Refresh Loop

```javascript
// In axios.ts interceptor, add logging:
console.log('401 detected, isRefreshing:', isRefreshing);
console.log('URL:', originalRequest.url);
console.log('Queue length:', failedQueue.length);
```

### Monitor Events

```javascript
// Listen for auth:unauthorized event
window.addEventListener('auth:unauthorized', () => {
  console.log('auth:unauthorized dispatched — session expired');
});
```

## Summary of Changes (Change 20)

| File | Changes | Why |
|------|---------|-----|
| `context/AuthContext.tsx` | Added isRestoringSession guard, atomic logout (API first), silent error handling | Prevent refresh loops, guarantee cleanup, avoid cascade |
| `api/axios.ts` | Added refresh timeout (10s), improved queue deadlock prevention | Prevent hanging, avoid re-queueing refresh itself |
| `stores/authStore.ts` | Added isRestoringSession flag, setRestoringSession action | Track restore state, prevent multiple simultaneous restores |
| `components/auth/ProtectedRoute.tsx` | Show spinner if isRestoringSession OR isLoading | Prevent premature redirect to login |

## Related Issues

- **Issue**: Session expires with continuous 401 errors
- **Fix**: Change 20 (fix-session-loop)
- **Status**: ✅ COMPLETE
- **Testing**: 14 test scenarios documented in sdd/fix-session-loop/spec
- **Verification**: See sdd-verify phase for full test suite results
