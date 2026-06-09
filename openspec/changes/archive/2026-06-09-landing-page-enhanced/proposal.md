## Why

Currently, the landing page is minimal (hero section only), which doesn't communicate the full value proposition of Food Store to potential customers. A modern, multi-section landing page with visual storytelling, featured products, and clear navigation will increase customer engagement, reduce bounce rate, and drive orders. Users need to understand WHO we are, WHAT we offer, HOW it works, and WHY they should trust us before committing to an order.

## What Changes

- **New Navbar with scroll navigation**: Sticky navigation bar with logo and links to each section (Hero, About, Featured, How It Works, Contact) that smoothly scroll to their respective sections.
- **Enhanced Hero Section**: Full-viewport hero with food imagery/emojis, compelling headline, subheadline, and prominent CTA button.
- **About Section**: Brand story with food/beverage theme, key value propositions (Fresh, Fast, Reliable), displayed with icons/emojis.
- **Featured Products Section**: Showcase 3-4 top products with images/descriptions and "Ver más" button linking to catalog.
- **How It Works Section**: Visual step-by-step process (Browse → Add to Cart → Checkout → Delivered) with icons and descriptions.
- **Contact Section**: Simple contact info (email, phone, hours) with footer-style layout and social links placeholder.
- **Visual Theme**: Food/beverage color palette (warm oranges, greens, fresh whites), food emojis/icons, responsive mobile design, smooth scroll behavior, modern typography.
- **Responsive Design**: Mobile-first approach with proper breakpoints (sm, md, lg). Hamburger menu on mobile for navbar.

## Capabilities

### New Capabilities
- `landing-navbar`: Sticky navigation bar with scroll-to-section links and hamburger menu for mobile.
- `landing-hero-enhanced`: Full-viewport hero section with food imagery, compelling headline, and primary CTA.
- `landing-about`: About/brand section with value propositions displayed via icons and text.
- `landing-featured-products`: Section showcasing 3-4 featured products from the catalog with product cards and link to full catalog.
- `landing-how-it-works`: Step-by-step visual guide (4 steps) explaining the ordering process with icons.
- `landing-contact`: Contact information section with email, phone, hours, and social links placeholder.
- `landing-scroll-behavior`: Smooth scroll-to-section behavior when clicking navbar links, with active state highlighting.

### Modified Capabilities
- `landing-page`: The main landing page layout will be modified to include all above sections and the navbar, replacing the current simple hero-only structure.

## Impact

- **Frontend files affected**: 
  - `frontend/src/pages/LandingPage.tsx` — restructured to include all sections and navbar
  - `frontend/src/components/landing/` — new components (Navbar.tsx, AboutSection.tsx, FeaturedProducts.tsx, HowItWorks.tsx, ContactSection.tsx) and enhanced HeroSection.tsx
  - `frontend/src/components/landing/LandingNavbar.tsx` — new sticky navbar with scroll navigation
  - CSS/Tailwind classes for animations and responsive layout

- **No backend changes required** — landing page is frontend-only; uses existing product catalog API if needed for featured products.

- **No breaking changes** — existing route `/` remains public, new functionality is additive.

- **Dependencies**: Relies on `product-catalog-core` change (for fetching featured products via existing `/api/v1/productos` endpoint).

