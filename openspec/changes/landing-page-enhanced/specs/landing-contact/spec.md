## ADDED Requirements

### Requirement: Contact section with business information
The contact section SHALL display contact information (email, phone number, hours of operation) in a clean, footer-style layout. Placeholder for social media links SHALL be included for future integration.

#### Scenario: Contact information is visible
- **WHEN** user scrolls to "Contacto" section at the bottom of landing page
- **THEN** section displays email, phone, and hours in an organized format

#### Scenario: Email and phone are clickable
- **WHEN** user clicks on email address
- **THEN** default email client opens with pre-filled recipient
- **WHEN** user clicks on phone number
- **THEN** on mobile devices, call dialog opens; on desktop, action is undefined (can be improved later)

#### Scenario: Social media links are visible
- **WHEN** user views contact section
- **THEN** placeholder icons for social media (Facebook, Instagram, Twitter) are visible and can be updated later

#### Scenario: Contact section is responsive
- **WHEN** user views contact section on mobile
- **THEN** information is readable and contact links are easily clickable (min 44x44px touch targets)

### Requirement: Footer/closing section styling
Contact section SHALL use the established food/beverage color palette and serve as a visual footer to the landing page, creating a sense of completion.

#### Scenario: Contact section feels like a proper footer
- **WHEN** user reaches contact section
- **THEN** section design signals the end of the page and provides clear call-to-action for contacting business
