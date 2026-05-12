## ADDED Requirements

### Requirement: Password Update
The system SHALL allow an authenticated user to change their password securely.

#### Scenario: Successful password change
- **WHEN** user sends correct current password and a new valid password to `PUT /api/users/me/password`
- **THEN** the system SHALL validate the current password, hash the new one with bcrypt (cost >= 10), and save it

#### Scenario: Incorrect current password
- **WHEN** user sends an incorrect current password to `PUT /api/users/me/password`
- **THEN** the system SHALL return a 400 Bad Request error
