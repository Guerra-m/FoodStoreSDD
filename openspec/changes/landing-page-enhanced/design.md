## Context

The current landing page is minimal (single hero section), which doesn't fully communicate the FoodStore brand or value proposition. Visitors need visual storytelling and clear navigation to understand the service before committing to an order. The existing codebase has React + Tailwind CSS, a working product catalog API, and authentication system in place. Navigation among sections should be smooth and modern, with mobile responsiveness as a first-class requirement.

## Goals / Non-Goals

**Goals:**
- Create a modern, multi-section landing page that tells the brand story and showcases the service.
- Implement smooth scroll-to-section navigation via a sticky navbar with active state highlighting.
- Display featured products (top 3-4) dynamically from the existing product catalog API.
- Achieve mobile-first responsive design with hamburger menu on smaller screens.
- Use food/beverage color palette and emoji/icon-based visual elements for thematic consistency.
- Maintain performance: lazy load images, optimize re-renders, keep bundle size minimal.

**Non-Goals:**
- Internationalization (i18n) of landing page text — keep as Spanish only for now.
- Backend API changes — use existing product catalog endpoints only.
- User authentication on landing page (it remains public and unauthenticated).
- Blog, testimonials carousel, or advanced animations (keep it simple, fast).

## Decisions

### 1. **Component Architecture: Modular Sections Over Monolithic Page**
   - **Decision**: Break the landing page into small, reusable section components (Navbar, Hero, About, FeaturedProducts, HowItWorks, Contact) instead of a single monolithic page component.
   - **Rationale**: Improves maintainability, makes testing easier, allows future reuse. Each section can be tested and styled independently.
   - **Alternative Considered**: Single large component — would be faster to write but harder to maintain as the page grows.

### 2. **Scroll Navigation: Anchor-Based with Intersection Observer (Optional Enhancement)**
   - **Decision**: Use React Router's scroll-to-element approach via refs and `Element.scrollIntoView()`. Start simple; add Intersection Observer only if needed for active state tracking.
   - **Rationale**: Native browser behavior, no extra dependencies, straightforward to implement. Smooth scroll is CSS-only.
   - **Alternative Considered**: Full Intersection Observer setup — unnecessary complexity for current scope; add only if performance becomes an issue.

### 3. **Navbar Behavior: Sticky + Toggle Menu on Mobile**
   - **Decision**: Sticky navbar (position: sticky) with hamburger menu on mobile (<md breakpoint). Close menu on link click.
   - **Rationale**: Standard pattern, works well on all devices, Tailwind provides out-of-the-box utilities.
   - **Alternative Considered**: Floating navbar — looks modern but adds complexity for minimal UX gain.

### 4. **Featured Products: Fetch from Existing API or Static Mock**
   - **Decision**: Fetch from `GET /api/v1/productos?limit=4` at component mount using `useEffect`. If API fails, show static fallback products with emojis.
   - **Rationale**: Real data feels more authentic; fallback ensures section never breaks. No need for complex caching — this is a landing page, not a catalog.
   - **Alternative Considered**: Hardcode static products — faster but less flexible; fetching is minimal extra effort and future-proofs for dynamic featured selection.

### 5. **Visual Theme: Tailwind CSS with Custom Color Palette**
   - **Decision**: Use Tailwind's extend config to add custom colors (e.g., `orange-food: #FF6B35`, `green-fresh: #2D5016`). Use food emojis (🍕, 🍔, 🥗, etc.) and Heroicons for step icons in "How It Works".
   - **Rationale**: Themed colors create cohesion; emojis are lightweight and universally recognizable; Heroicons integrates well with Tailwind.
   - **Alternative Considered**: Custom SVGs for all icons — more control but overkill for this use case.

### 6. **Responsive Breakpoints: Mobile-First Design**
   - **Decision**: Default styles for mobile (sm), then enhance for md (≥768px) and lg (≥1024px). Hamburger menu hides on md+.
   - **Rationale**: Mobile-first ensures core functionality works on all devices; Tailwind's responsive utilities make this natural.

### 7. **Performance & Loading: Lazy Images and Memoization**
   - **Decision**: Use `img` tags with `loading="lazy"` attribute. Wrap heavy sections with `React.memo` if performance monitoring shows re-renders.
   - **Rationale**: Lazy loading defers off-screen image requests; memo prevents unnecessary re-renders on parent updates.
   - **Alternative Considered**: Next.js Image component — overkill for a Vite + React project; native lazy loading is sufficient.

### 8. **State Management: None Required (Stateless Sections + Local Hamburger State)**
   - **Decision**: Sections are stateless presentational components. Navbar manages its own hamburger menu state via `useState`.
   - **Rationale**: Keeps logic simple; no need for Zustand or Context here. Each section owns its data fetch (e.g., FeaturedProducts fetches its own products).
   - **Alternative Considered**: Global Zustand store — unnecessary; this is isolated UI, not cross-page data.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| API call in FeaturedProducts fails silently | Show static fallback products; log error to console for debugging. Test with API offline. |
| Navbar hamburger menu not closing on link click | Add onClick handler to menu items that closes the menu. Test on mobile device. |
| Scroll performance on low-end devices | Lazy load images, keep animations CSS-only (no JavaScript animations), test on 3G network. |
| Mobile navbar hamburger menu overlaps content | Use `z-index` strategically; ensure menu slides in from top/side without covering key content. |
| Images take time to load, feels sluggish | Preload critical images in Hero; lazy load the rest. Consider lightweight image format (WebP with fallback). |
| Sticky navbar height changes on mobile (responsive text) | Set fixed navbar height or use `h-16` (64px) consistently to prevent layout shift. |

## Migration Plan

1. **Create new components**: Build all section components locally (Navbar, AboutSection, FeaturedProducts, HowItWorks, ContactSection) and enhanced HeroSection.
2. **Restructure LandingPage.tsx**: Import all sections, arrange in vertical flow, add ref handlers for scroll-to-section.
3. **Add Tailwind utilities** (if needed): Extend tailwind.config.js with custom food colors.
4. **Test on desktop and mobile**: Chrome DevTools device emulation, real device testing.
5. **Commit and deploy**: Single commit with all landing page changes; no breaking changes, so safe to merge directly to main.

## Open Questions

1. **Should we add a CTA button in every section (e.g., "Pedir ahora" in About and How It Works)**, or only in Hero and Featured Products?
   - Recommendation: Add subtle "Pedir ahora" in Featured Products section only to avoid button fatigue.
   
2. **Should contact section include a form or just display info?**
   - Recommendation: Display-only for now (email, phone, hours, social links); form is future work.

3. **What are the 3-4 featured products?** Should they be hardcoded, randomly selected, or determined by a backend flag?
   - Recommendation: Fetch top 4 by ID or random sample from API; if no data, show static fallback with emojis.

