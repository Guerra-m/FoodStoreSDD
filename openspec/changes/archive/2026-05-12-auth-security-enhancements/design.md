## Context

This change addresses missing security features and UX improvements. It introduces password management, secures frontend routing, and standardizes error handling.

## Goals / Non-Goals

**Goals:**
- Provide a secure password change endpoint.
- Protect sensitive routes on the frontend based on user roles.
- Standardize error feedback across the UI.

**Non-Goals:**
- Changing existing authentication JWT/Refresh token logic.

## Decisions

- **Password Hashing**: Use `bcrypt` with cost factor 10 or higher.
- **Route Protection**: Use a High-Order Component (HOC) or wrapper `PrivateRoute` that checks `useAuthStore().userRole`.
- **Global Errors**: Axios interceptor to catch specific HTTP status codes and dispatch toast notifications via the existing system.

## Risks / Trade-offs

- [Risk] Unauthorized access to frontend routes → Mitigation: Server-side RBAC validation remains the source of truth; frontend protection is for UX/accessibility.
