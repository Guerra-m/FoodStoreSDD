## Why

The system requires enhanced security and user feedback mechanisms to complete the initial auth and profile implementation. Specifically, users need a secure way to update passwords, frontend routes must be protected based on roles, and global error handling is necessary to ensure a smooth user experience.

## What Changes

- **US-063**: Add `PUT /api/users/me/password` to allow users to update their own passwords securely using `bcrypt` (cost >= 10).
- **US-075**: Implement `PrivateRoute` component in React to protect routes based on user roles stored in Zustand.
- **US-076**: Implement global Axios interceptor for error handling (401, 403, 422, 500) and toast notifications. Logout on 401.

## Capabilities

### New Capabilities
- `password-management`: Secure password change functionality.
- `frontend-security`: Route protection and global error handling.

## Impact

- User API controller and service layers.
- Frontend Auth store (Zustand) and Routing configuration.
- Global Axios client configuration.
