## MODIFIED Requirements

### Requirement: Landing page layout with all sections
The landing page SHALL now include all 6 main sections (Navbar, Hero, About, Featured Products, How It Works, Contact) arranged in a single-page scrollable layout. The page SHALL maintain the existing public route `/` and require no authentication.

#### Scenario: Landing page displays all sections in sequence
- **WHEN** user visits `/` 
- **THEN** all 6 sections are visible and scrollable in the correct order

#### Scenario: Landing page remains public and unauthenticated
- **WHEN** unauthenticated user visits `/`
- **THEN** landing page loads without redirection to login

#### Scenario: CTA button behavior depends on auth status
- **WHEN** authenticated user clicks "Pedir ahora"
- **THEN** user is redirected to catalog (`/catalog`)
- **WHEN** unauthenticated user clicks "Pedir ahora"
- **THEN** user is redirected to login page or catalog (system behavior to be confirmed)
