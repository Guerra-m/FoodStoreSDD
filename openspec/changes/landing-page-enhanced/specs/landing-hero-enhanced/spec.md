## ADDED Requirements

### Requirement: Enhanced hero section with full viewport coverage
The hero section SHALL occupy the full viewport height (or minimum 500px on smaller screens) with a compelling headline, subheadline, and primary CTA button. The section SHALL feature a food/beverage themed background (gradient or image with food emojis overlay) and modern typography.

#### Scenario: Hero section displays with proper height and layout
- **WHEN** user lands on the page
- **THEN** hero section fills the viewport with headline, subheadline, and CTA button centered and readable

#### Scenario: CTA button navigates to catalog
- **WHEN** user clicks the "Pedir ahora" button in hero
- **THEN** user is redirected to the catalog/login page (depending on auth status)

#### Scenario: Hero section is responsive on mobile
- **WHEN** user views landing page on mobile device
- **THEN** hero section scales appropriately, text remains readable, button is touch-friendly (min 44x44px)

### Requirement: Hero section visual design with food theme
Hero section SHALL use a warm color palette (oranges, greens, fresh whites), include food emojis (🍕, 🍔, 🥗, etc.), and modern sans-serif typography.

#### Scenario: Food emojis and colors create thematic consistency
- **WHEN** user views hero section
- **THEN** food emojis and warm colors reinforce the brand theme
