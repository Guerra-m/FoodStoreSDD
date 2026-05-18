## Context

El proyecto tiene un sistema de auth en transición. Originalmente todo el auth vivía en `backend/app/auth/` con endpoints `/auth/*` y servicios síncronos. Después se creó un sistema nuevo en `backend/app/modules/usuarios/` con endpoints `/api/v1/auth/*` y servicios async con UnitOfWork. Ambos sistemas conviven y apuntan a la misma tabla `usuario`.

El frontend tiene el mismo problema: `authApi.ts` usa el sistema viejo (fetch nativo a `/auth/*`), mientras que `customers.ts` usa el sistema nuevo (axios a `/api/v1/auth/*`).

## Goals / Non-Goals

**Goals:**
- Agregar endpoint `PATCH /api/v1/auth/me` para editar perfil
- Actualizar type `User` del frontend: `rol: string` → `roles: string[]`, agregar campos faltantes
- Tipar el authStore correctamente con `User` en vez de `any`
- Persistir el usuario en authStore (localStorage) para que sobreviva a recargas
- Migrar AuthContext a usar el sistema nuevo (`/api/v1/auth/*`) vía customers.ts
- Actualizar todos los references a `user.rol` en el frontend

**Non-Goals:**
- NO migrar direcciones (ya funcionan con `/api/v1/clientes/direcciones/*`)
- NO eliminar el sistema auth viejo (`backend/app/auth/`) — se depreca pero no se borra
- NO migrar admin endpoints (ya funcionan con `/admin/*`)
- NO agregar carga de fotos/avatars (solo campo `foto_url` como string URL)
- NO tocar el backend auth models/services viejos

## Decisions

### 1. Endpoint PATCH /api/v1/auth/me
- **Decisión**: Agregar al `router.py` existente de `modules/usuarios`. Reutilizar el `ClientePerfilUpdate` schema que ya existe. Invocar `ClienteService.actualizar_perfil()` que ya está implementado.
- **Razón**: El service ya existe, el schema ya existe, solo falta la ruta. Es código muerto esperando ser conectado.
- **Implementación**:
  ```python
  @router.patch("/me", response_model=UserResponse)
  async def update_me(
      data: ClientePerfilUpdate,
      payload: dict = Depends(get_current_user),
  ):
      usuario_id = int(payload.get("sub"))
      return await cliente_service.actualizar_perfil(usuario_id, data)
  ```

### 2. Type User en frontend
- **Decisión**: Cambiar `rol: string` → `roles: string[]`, agregar `telefono`, `foto_url`, `fecha_nacimiento`, `actualizado_en`. Coincidir con el `UserResponse` del backend nuevo.
- **Razón**: El backend devuelve `roles: ["Cliente", "Admin"]`, no un solo rol. El type actual está roto para usuarios con múltiples roles.
- **Impacto**: Donde sea que se use `user.rol` (sidebar, protected route, admin layout) hay que cambiarlo a `user.roles.includes(...)`.

### 3. AuthStore tipado
- **Decisión**: `interface AuthState { user: User | null; ... }` con el type `User` corregido.
- **Razón**: `any` es siempre mala práctica y esconde errores de tipo.
- **Persistencia**: Modificar `partialize` para que persista también `user`. Sin esto, al recargar la página el user se pierde y hay que esperar a que restoreSession lo traiga de vuelta.

### 4. AuthContext usa customers.ts
- **Decisión**: Migrar `AuthContext.tsx` para que importe `customers.ts` (que usa axios con el interceptor) en lugar de `authApi.ts` (que usa fetch nativo).
- **Razón**: `customers.ts` usa el axios interceptor que ya tiene refresh automático de token, manejo de 401, etc. Es el sistema nuevo y más robusto.
- **Qué cambia**: 
  - `loginUser`, `registerUser` se importan de `customers.ts` (o se crean allí si no existen)
  - `refreshAccessToken`, `logoutUser`, `getCurrentUser` igual
  - Se depreca `authApi.ts` (se deja pero se marca como deprecated)

### 5. user.rol → user.roles en todo el frontend
- **Decisión**: Buscar y reemplazar todos los references a `user.rol` y `user?.rol` por `user.roles.includes(...)`.
- **Razón**: Es un cambio rompiente necesario. Si no se hace, los guards de roles (Admin) dejan de funcionar.
- **Archivos afectados**: Sidebar, ProtectedRoute, AdminLayout, y cualquier otro componente que verifique roles.

## Risks / Trade-offs

- **[Breaking] user.rol → user.roles**: Es un cambio que va a romper cualquier componente que use `user.rol`. La migración es mecánica (find & replace con lógica) pero hay que ser exhaustivo.
- **[AuthContext] Migrar a customers.ts**: `customers.ts` usa axios, que tiene interceptor con refresh automático. Si el refresh falla, el interceptor hace logout. Asegurarse de que el flujo de login/register también use axios.
- **[Persistencia] Guardar user en localStorage**: Si bien es cómodo para la UX, el user object podría contener datos sensibles. Evaluar si es aceptable para el alcance del proyecto (es una app de facultad, no producción crítica).
