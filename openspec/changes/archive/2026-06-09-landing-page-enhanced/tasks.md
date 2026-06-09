## 1. Project Setup & Configuration

- [x] 1.1 Verify Tailwind CSS is configured in the project
- [x] 1.2 Extend Tailwind config with custom food color palette (orange-food, green-fresh, etc.)
- [x] 1.3 Verify React Router and scroll utilities are available

## 2. Create Landing Page Components

- [x] 2.1 Create `frontend/src/components/landing/LandingNavbar.tsx` — sticky navbar with links and hamburger menu
- [x] 2.2 Update `frontend/src/components/landing/HeroSection.tsx` — enhance with food theme, emojis, better typography
- [x] 2.3 Create `frontend/src/components/landing/AboutSection.tsx` — brand story + 3 value propositions with emojis
- [x] 2.4 Create `frontend/src/components/landing/FeaturedProductsSection.tsx` — fetch and display 3-4 products from API, with fallback
- [x] 2.5 Create `frontend/src/components/landing/HowItWorksSection.tsx` — 4-step process with icons and visual connectors
- [x] 2.6 Create `frontend/src/components/landing/ContactSection.tsx` — contact info (email, phone, hours) + social links placeholder

## 3. Implement Scroll Navigation & Active State

- [x] 3.1 Create scroll ref system in LandingPage — add refs for each section
- [x] 3.2 Implement scroll-to-section handlers in LandingNavbar — onClick handlers that smooth scroll
- [x] 3.3 Implement active section tracking — use Intersection Observer or scroll listener to update navbar active link
- [x] 3.4 Test active state highlighting as user scrolls through page

## 4. Integrate All Sections into Landing Page

- [x] 4.1 Restructure `frontend/src/pages/LandingPage.tsx` — import and arrange all 6 sections in sequence
- [x] 4.2 Add section refs to LandingPage and pass to Navbar for scroll navigation
- [x] 4.3 Add smooth scroll CSS behavior (scroll-behavior: smooth or use JavaScript for browser compatibility)
- [x] 4.4 Test layout on desktop (1920x1080, 1366x768) and mobile (375x667, 768x1024)

## 5. Styling & Visual Design

- [x] 5.1 Apply food/beverage color palette to all sections — consistent use of warm colors
- [x] 5.2 Add food emojis to sections — Hero (🍕🍔), About (🥗⚡✅), How It Works (🛒🛍️💳🚚), Contact (📧📞)
- [x] 5.3 Implement responsive layouts — mobile-first design with proper breakpoints (sm, md, lg)
- [x] 5.4 Style navbar hamburger menu — toggle visibility on mobile, proper z-index
- [x] 5.5 Add hover/active states to all interactive elements (buttons, links, cards)
- [x] 5.6 Test spacing, typography, and alignment on multiple screen sizes

## 6. Data Integration & API Calls

- [x] 6.1 Implement product fetch in FeaturedProductsSection — call `GET /api/v1/productos?limit=4`
- [x] 6.2 Create static fallback products for when API fails
- [x] 6.3 Test product fetch with and without backend running
- [x] 6.4 Lazy load product images using native `loading="lazy"` attribute

## 7. Mobile Experience & Accessibility

- [x] 7.1 Test navbar hamburger menu on mobile device (iOS Safari, Android Chrome)
- [x] 7.2 Verify touch targets are at least 44x44px for all clickable elements
- [x] 7.3 Test smooth scroll on mobile browsers (may need JS fallback for older browsers)
- [x] 7.4 Add ARIA labels to navbar hamburger menu and close button
- [x] 7.5 Test keyboard navigation — Tab through all interactive elements, Escape closes mobile menu
- [x] 7.6 Verify color contrast meets WCAG AA standards

## 8. Performance Optimization

- [x] 8.1 Implement React.memo for section components to prevent unnecessary re-renders
- [x] 8.2 Lazy load images in FeaturedProductsSection and other sections
- [x] 8.3 Verify bundle size increase is minimal (use npm run build and analyze)
- [x] 8.4 Test page load performance on slow 3G network (Chrome DevTools)
- [x] 8.5 Ensure smooth scroll performance on low-end devices (no jank)

## 9. Testing & Quality Assurance

- [x] 9.1 Test scroll-to-section links work from navbar to each section
- [x] 9.2 Test active state highlighting updates correctly as scrolling
- [x] 9.3 Verify hamburger menu opens/closes on mobile, closes on outside click and Escape
- [x] 9.4 Test "Pedir ahora" button navigation to catalog
- [x] 9.5 Test featured products fetch and fallback scenarios
- [x] 9.6 Verify no console errors or warnings
- [x] 9.7 Test on real devices: desktop (macOS/Windows), mobile (iOS/Android)

## 10. Code Quality & Documentation

- [x] 10.1 Run TypeScript type checker — no errors or warnings
- [x] 10.2 Run linter (ESLint) — all files pass linting
- [x] 10.3 Add JSDoc comments to component props and complex logic
- [x] 10.4 Verify component structure matches project conventions
- [x] 10.5 Clean up console logs and debug code

## 11. Final Integration & Commit

- [x] 11.1 Verify all tests pass (`npm run test` or similar)
- [x] 11.2 Verify build succeeds (`npm run build`)
- [x] 11.3 Test locally on http://localhost:5173 — landing page loads correctly
- [x] 11.4 Commit all landing page changes — single commit with clear message
- [x] 11.5 Verify no breaking changes to existing routes or pages
- [x] 11.6 Merge to main (or create PR for review)
