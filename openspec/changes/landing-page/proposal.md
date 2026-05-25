# Proposal: Landing Page Pública

## Intent
Crear una landing page pública (`/`) que presente el food store a usuarios no autenticados, con hero section y botón principal "Pedir ahora" que redirecciona al catálogo protegido.

**Por qué**: Actualmente la app va directo a login sin mostrar el negocio. El usuario necesita una puerta de entrada visible con propuesta de valor clara.

## Scope

### In Scope
- Nueva ruta pública `/` (sin autenticación requerida)
- Hero section con imagen/descripción del food store
- Botón principal "Pedir ahora" → redirige a `/catalog` (protegido)
- Layout limpio sin sidebar ni admin header (LandingLayout)
- Ruteo: `/` → LandingPage (pública), `/catalog` → sigue siendo protegida (ProtectedRoute)
- Completamente frontend-only (cero cambios en backend)

### Out of Scope
- SEO/meta tags (futuro)
- Multidioma (futuro)
- Customización de imágenes por admin (futuro)
- Login desde landing page (redirecciona a `/login` si intenta acceder `/catalog` sin auth)

## Capabilities

### New Capabilities
- `landing-page-layout`: Layout público sin sidebar/auth header para landing page
- `public-hero-section`: Hero section con branding, descripción y CTA principal

### Modified Capabilities
- `public-routing`: Rutas públicas. Ahora existe `/` además de `/login` y `/register`.

## Approach

**High-level**:
1. Crear `LandingPage.tsx` con hero section + descripción del negocio
2. Crear `LandingLayout.tsx` — layout público sin sidebar (solo main content limpio)
3. Actualizar router: agregar `<Route path="/" element={<LandingPage />} />` pública ANTES del ProtectedRoute
4. Página `/catalog` sigue siendo ProtectedRoute (sin cambios)
5. Link "Pedir ahora" en landing → `/catalog` (usuario sin auth será redirigido a login automáticamente)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/pages/LandingPage.tsx` | New | Landing page principal con hero + descripción |
| `frontend/src/components/landing/LandingLayout.tsx` | New | Layout público sin sidebar |
| `frontend/src/router/index.tsx` | Modified | Agregar ruta `/` pública antes de ProtectedRoute |
| `frontend/src/App.tsx` | No change | AppRoutes importado sin cambios |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Usuario intenta acceder `/catalog` desde landing sin auth | High | ProtectedRoute redirige a `/login`. Flujo natural de onboarding. |
| Estilo/responsiveness inconsistente | Low | Usar mismo Tailwind + componentes (Button, Card) que el resto de la app. |
| Landing page no motiva a registrarse | Medium | Hero section clara + benefits section. Futuro: mejorar copy/imagenes. |

## Rollback Plan

1. Eliminar `frontend/src/pages/LandingPage.tsx`
2. Eliminar `frontend/src/components/landing/LandingLayout.tsx`
3. Revertir `frontend/src/router/index.tsx` — remover ruta `/` pública
4. Buscar todos los links a `/` y actualizar a `/login` si es necesario (probablemente solo en documentación)

## Dependencies

- **Change 5** (`product-catalog-core`) — ✅ Existe. Landing redirige a `/catalog` que ya existe.
- **Change 2** (`auth-and-rbac-system`) — ✅ Existe. ProtectedRoute protege `/catalog`.
- **No nuevas dependencias**

## Success Criteria

- [ ] Usuario no autenticado ve landing page en `/`
- [ ] Landing page muestra hero section con descripción clara del food store
- [ ] Botón "Pedir ahora" en landing redirige a `/catalog`
- [ ] Usuario sin auth en `/catalog` es redirigido a `/login` automáticamente
- [ ] Layout limpio sin sidebar en landing page
- [ ] `/login` y `/register` siguen siendo accesibles y públicas
- [ ] Responsive en mobile/tablet/desktop
