## Why

La sesión de usuario se pierde al navegar entre páginas. El flujo es: el usuario inicia sesión correctamente, pero al hacer click en cualquier link del menú (catálogo, perfil, etc.) la sesión se cierra y es redirigido al login. Esto hace que la aplicación sea funcionalmente inusable para usuarios autenticados.

El problema tiene múltiples causas raíz que trabajan en conjunto:
- Los links de navegación usan `<a href>` en lugar de `<Link>` de react-router, provocando full page reloads que destruyen el estado React de AuthContext.
- `restoreSession()` en AuthContext es async pero nunca setea `isLoading=true`, por lo que ProtectedRoute redirige a login antes de que la sesión se restaure.
- Las fuentes de verdad de tokens están inconsistentes: sessionStorage (lib/auth.ts), localStorage (zustand persist), y React state (AuthContext) tienen datos parciales y desincronizados.
- El interceptor de axios hace `logout()` inmediato en cualquier 401 sin intentar refresh automático primero.

## What Changes

- **Sidebar.tsx y HomePage.tsx**: Reemplazar `<a href>` por `<Link to>` de react-router-dom para navegación SPA sin full reload.
- **AuthContext.tsx - restoreSession**: Agregar `setIsLoading(true)` antes de `restoreSession()` y `setIsLoading(false)` al finalizar, para que ProtectedRoute espere.
- **AuthContext.tsx - unificar fuente de verdad**: `restoreSession()` debe leer `accessToken` de zustand persist (localStorage), no de `getTokens()` (sessionStorage), y al hacer login guardar en ambos.
- **axios.ts - refresh automático en 401**: Antes de hacer logout en 401, intentar refresh del token. Solo hacer logout si el refresh falla.

## Capabilities

### New Capabilities
<!-- No hay nuevas capabilities. Todo son fixes sobre capacidades existentes. -->

### Modified Capabilities
- `frontend/src/context/AuthContext.tsx`: restoreSession con loading state, unificación de storage.
- `frontend/src/components/layout/Sidebar.tsx`: Links SPA con `<Link>`.
- `frontend/src/pages/HomePage.tsx`: Links SPA con `<Link>`.
- `frontend/src/api/axios.ts`: Refresh automático en 401 en vez de logout directo.
- `frontend/src/lib/auth.ts` (o eliminación): Simplificar/unificar storage de tokens.

## Impact

- **Frontend**: Modificaciones en componentes de navegación, AuthContext, axios interceptor, y posible limpieza de lib/auth.ts.
- **No afecta backend**: Este change es 100% frontend. No hay cambios en APIs, schemas de DB, ni lógica de negocio.
- **No breaking changes**: Todo son fixes. La funcionalidad existente se mantiene idéntica, solo mejora la persistencia de sesión.
