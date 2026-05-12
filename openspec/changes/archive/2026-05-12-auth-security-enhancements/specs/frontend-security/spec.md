## ADDED Requirements

### Requirement: Frontend Route Protection
The system SHALL protect frontend routes, ensuring only authorized users can access specific pages.

#### Scenario: Unauthorized access redirection
- **WHEN** user tries to access a protected route without the required role (fetched from Zustand)
- **THEN** the system SHALL redirect the user to `/unauthorized` or `/login`

### Requirement: Global Error Handling
The system SHALL handle API errors globally via Axios interceptors.

#### Scenario: API Error Notification
- **WHEN** an API request fails with 401, 403, 422, or 500 status
- **THEN** the system SHALL display a toast notification to the user

#### Scenario: 401 Unauthorized redirect
- **WHEN** an API request fails with 401 status
- **THEN** the system SHALL trigger an automatic user logout
