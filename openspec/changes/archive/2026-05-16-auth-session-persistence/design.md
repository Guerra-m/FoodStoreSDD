## Context

La sesión de usuario se pierde al navegar entre páginas porque hay 4 problemas que trabajan en conjunto:

1. **Full page reloads**: Sidebar.tsx y HomePage.tsx usan `<a href>` en vez de `<Link to>`. Cada click desmonta y remonta React, perdiendo el estado de AuthContext.
2. **restoreSession sin loading**: AuthContext corre `restoreSession()` de forma async pero `isLoading` arranca en `false`. ProtectedRoute ve `!isLoading && !isAuthenticated` y redirige a login antes de que la sesión se restaure.
3. **Fuentes de verdad inconsistentes**: Los tokens viven en 3 lugares distintos (sessionStorage en lib/auth.ts, localStorage en zustand persist, React state en AuthContext) y no están sincronizados.
4. **Interceptor de axios mata sesión en 401**: Cualquier API call con token expirado → 401 → `logout()` inmediato sin intentar refresh.

## Goals / Non-Goals

**Goals:**
- Navegación SPA usando `<Link>` de react-router-dom en Sidebar y HomePage
- restoreSession con estado de loading para evitar falsos redirects a login
- Unificar fuente de verdad de tokens: zustand persist (localStorage) como fuente primaria
- Refresh automático de token en el interceptor de axios ante 401
- Limpiar código duplicado o inconsistente de manejo de tokens

**Non-Goals:**
- NO cambiar el backend ni las APIs
- NO modificar el flujo de login/logout existente
- NO cambiar la lógica de roles y permisos
- NO tocar el sistema de refresh token rotation del backend (ya funciona correctamente)
- NO migrar a otro sistema de almacenamiento de tokens

## Decisions

### 1. Links SPA: reemplazar `<a>` por `<Link>` en Sidebar y HomePage
- **Decisión**: Cambiar todos los `<a href="...">` por `<Link to="...">` de react-router-dom.
- **Razón**: `react-router-dom` ya es dependencia del proyecto. `<Link>` evita full page reload y preserva el estado React (AuthContext, stores). Incluso si hubiera otros problemas de sesión, este es un fix necesario porque sin navegación SPA cualquier solución de auth es frágil.
- **Alternativa descartada**: Dejar `<a>` y usar `event.preventDefault()` + `window.history.pushState()` + manejo manual — es más código, más propenso a errores, y reinventa la rueda.
- **Impacto**: Sidebar.tsx y HomePage.tsx. También cambiar `href` por `to` y `window.location.pathname === href` por `location.pathname === to` (usando `useLocation()` de react-router).

### 2. restoreSession con loading state
- **Decisión**: En AuthContext.tsx, setear `setIsLoading(true)` al inicio de `restoreSession()` y `setIsLoading(false)` en el finally.
- **Razón**: El flujo actual redirige a login antes de que la sesión se restaure porque ProtectedRoute ve `isLoading=false, user=null` y asume que no hay sesión. Con `isLoading=true`, ProtectedRoute muestra un spinner y espera.
- **Implementación**: Envolver todo el bloque `restoreSession` en un try/finally. En el finally, siempre setear `isLoading=false`.

### 3. Unificar fuente de verdad: zustand persist como primaria
- **Decisión**: `restoreSession()` leerá el `accessToken` de zustand store (que persiste en localStorage via `persist` middleware), no de `getTokens()` (sessionStorage).
- **Razón**: Zustand persist ya está configurado y guarda en localStorage, que sobrevive a cierres de pestaña. SessionStorage se pierde al cerrar la pestaña. Tener dos fuentes de verdad causa desincronización.
- **Qué cambia**:
  - `restoreSession()`: leer `useAuthStore.getState().accessToken` en vez de `getTokens().accessToken`
  - Si hay token en zustand pero expirado, intentar refresh usando `getTokens().refreshToken` (sessionStorage para refresh token está bien porque es más seguro no persistir refresh token en localStorage)
  - login(): guardar en zustand + sessionStorage (como ahora)
  - logout(): limpiar ambos
- **Trade-off**: El refresh token sigue en sessionStorage. Si el usuario cierra la pestaña y vuelve, el access token expirado en zustand no se puede refrescar (no hay refresh token). Pero eso es esperable — es como cualquier app web moderna (Spotify, GitHub, etc.).

### 4. Refresh automático en interceptor de axios
- **Decisión**: En el interceptor de respuesta de axios, ante un 401, ANTES de hacer logout, intentar refrescar el token. Si el refresh es exitoso, reintentar la request original. Si falla, hacer logout.
- **Razón**: El access token expira a los 15 minutos. Sin refresh automático, cualquier request después de 15 minutos falla con 401 y mata la sesión. Con refresh automático, el token se renueva silenciosamente.
- **Riesgo de loop infinito**: Usar un flag `_retry` en la config de la request para evitar reintentar si el refresh mismo devuelve 401.
- **Implementación**:
  ```typescript
  // En el response error interceptor
  if (status === 401 && !error.config._retry) {
    error.config._retry = true;
    try {
      const { refreshToken } = getTokens();
      if (refreshToken) {
        const response = await refreshAccessToken(refreshToken);
        // Guardar nuevos tokens
        saveTokens(response.access_token, response.refresh_token);
        useAuthStore.getState().setAuth(response.access_token, response.user);
        // Reintentar request original con nuevo token
        error.config.headers.Authorization = `Bearer ${response.access_token}`;
        return api(error.config);
      }
    } catch {
      // Refresh falló → logout
    }
    useAuthStore.getState().logout();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  ```

### 5. Limpiar duplicación de storage
- **Decisión**: Simplificar `lib/auth.ts` para que sea solo un wrapper alrededor de sessionStorage para refresh token, y que el accessToken viva exclusivamente en zustand persist.
- **Razón**: Simplifica el modelo mental: una fuente de verdad para cada token.
- **Qué cambia**: `getTokens()` ya no se usa para leer accessToken desde auth context. Se mantiene para refresh token.

## Risks / Trade-offs

- **[Sesión] Refresh token en sessionStorage**: Si el usuario cierra la pestaña, el refresh token se pierde. Al volver, si el access token expiró, no se puede refrescar → login requerido. Esto es comportamiento deliberado y coincide con apps modernas. Mitigación: El access token dura 15 min, si el usuario vuelve dentro de ese tiempo, la sesión se restaura sin problemas.
- **[Carrera] Múltiples requests en paralelo con 401**: Si varias requests disparan refresh simultáneamente, podríamos refrescar el token múltiples veces. Mitigación: Usar un flag global `isRefreshing` y una cola de requests pendientes para que solo un refresh ocurra a la vez. Implementar si se detecta el problema en QA.
- **[UX] Redirect a login después de refresh fallido**: Es correcto — si el refresh falla, el usuario debe loguearse de nuevo. El toast de error puede ayudar a explicar por qué.
