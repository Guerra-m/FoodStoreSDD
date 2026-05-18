## 1. Navegación SPA — Sidebar.tsx

- [ ] 1.1 Importar `Link` y `useLocation` de `react-router-dom` en `Sidebar.tsx`
- [ ] 1.2 Cambiar `<a href={href}>` por `<Link to={href}>` en `NavLink`
- [ ] 1.3 Cambiar `window.location.pathname === href` por `location.pathname === to` usando `useLocation()`

## 2. Navegación SPA — HomePage.tsx

- [ ] 2.1 Importar `Link` de `react-router-dom` en `HomePage.tsx`
- [ ] 2.2 Reemplazar todos los `<a href="...">` por `<Link to="...">` (catálogo, perfil, mis pedidos)

## 3. AuthContext — restoreSession con loading state

- [ ] 3.1 Envolver el bloque `restoreSession` en un `try/finally` con `setIsLoading(true)` al inicio
- [ ] 3.2 Setear `setIsLoading(false)` en el `finally` (tanto en éxito como en error)
- [ ] 3.3 Verificar que `ProtectedRoute` use `isLoading` para mostrar spinner en vez de redirect

## 4. AuthContext — unificar fuente de verdad

- [ ] 4.1 En `restoreSession()`, leer `accessToken` de `useAuthStore.getState().accessToken` en vez de `getTokens().accessToken`
- [ ] 4.2 Si hay token en zustand pero expirado, intentar refresh usando `getTokens().refreshToken`
- [ ] 4.3 Si el refresh funciona, guardar nuevos tokens en zustand + sessionStorage
- [ ] 4.4 Si no hay token ni en zustand ni en sessionStorage, salir sin error (es un usuario no logueado)

## 5. Axios interceptor — refresh automático en 401

- [ ] 5.1 En el interceptor de respuesta (`api.interceptors.response.use`), ante 401, antes de hacer logout, intentar refresh del token
- [ ] 5.2 Usar flag `_retry` en `error.config` para evitar loops infinitos de refresh
- [ ] 5.3 Si el refresh es exitoso, guardar nuevos tokens, actualizar header `Authorization`, y reintentar la request original
- [ ] 5.4 Si el refresh falla (catch), hacer logout + disparar evento `auth:unauthorized`

## 6. Limpiar duplicación de storage (opcional)

- [ ] 6.1 Verificar si `lib/auth.ts` tiene funciones duplicadas que ya no se usan
- [ ] 6.2 Simplificar `getTokens()` para que solo maneje refresh token desde sessionStorage
- [ ] 6.3 Mantener `saveTokens()` y `clearTokens()` para compatibilidad con login/logout existente
