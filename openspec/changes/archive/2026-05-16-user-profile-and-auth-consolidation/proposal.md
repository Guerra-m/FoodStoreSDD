## Why

Actualmente el perfil de usuario no se puede editar desde el frontend. Cuando el usuario va a "Mi Perfil" y completa el formulario de edición, la request a `PATCH /api/v1/auth/me` falla porque ese endpoint **no existe en el backend**. El service `ClienteService.actualizar_perfil()` está completamente implementado pero nunca se conectó a una ruta HTTP.

Adicionalmente, hay problemas que impedirían que la edición funcione correctamente aunque el endpoint existiera:

- **Type `User` desactualizado**: El frontend define `rol: string` (singular), pero el backend devuelve `roles: string[]` (array). Esto causa que el sidebar y componentes que verifican `user.rol === 'Admin'` nunca funcionen correctamente.
- **Dos sistemas de auth conviviendo**: El backend monta TODOS los endpoints viejos (`/auth/*`) y nuevos (`/api/v1/auth/*`). El frontend usa el sistema viejo para auth (`authApi.ts` → `/auth/*`) y el nuevo para perfil (`customers.ts` → `/api/v1/auth/*`). Esto causa inconsistencia y duplicación de código.
- **AuthStore sin tipado**: `user: any | null` en vez de un tipo concreto, lo que hace el código propenso a errores y dificulta el desarrollo.

## What Changes

### Backend
- **Agregar ruta `PATCH /api/v1/auth/me`** en `backend/app/modules/usuarios/router.py` que invoque `ClienteService.actualizar_perfil()`.

### Frontend — Types
- **Actualizar type `User`** en `types/auth.ts`: cambiar `rol: string` por `roles: string[]`, agregar campos faltantes (`telefono`, `foto_url`, `fecha_nacimiento`, `actualizado_en`).

### Frontend — AuthStore
- **Corregir tipado del store**: cambiar `user: any | null` por `user: User | null` usando el type corregido.
- **Persistir el usuario**: modificar `partialize` para que también persista `user` en localStorage, así sobrevive a recargas de página.

### Frontend — Use new auth system
- **Mover `AuthContext`** a usar los endpoints nuevos (`/api/v1/auth/*`) vía `customers.ts` en vez del authApi legacy (`/auth/*`).
- **Deprecar `authApi.ts`** o actualizarlo para que apunte al nuevo sistema.

### Frontend — Profile page
- **Asegurar que `MiPerfil.tsx`** funciona correctamente con los nuevos types y el endpoint PATCH.

## Capabilities

### New Capabilities
- `user-profile-edition`: Endpoint y frontend para editar perfil de usuario (nombre, teléfono, foto, fecha de nacimiento).

### Modified Capabilities
- `user-auth`: Type `User` actualizado con `roles: string[]` y campos completos.
- `auth-store`: AuthStore con tipado fuerte y persistencia de usuario.
- `auth-api`: Consolidado al nuevo sistema `/api/v1/auth/*`.

## Impact

- **Backend**: Agregar 1 ruta a `router.py` (~8 líneas).
- **Frontend Types**: `types/auth.ts` — cambio de schema mayor pero hacia adelante.
- **Frontend Store**: `stores/authStore.ts` — tipado y persistencia.
- **Frontend Context**: `context/AuthContext.tsx` — migrar imports de authApi a customersApi.
- **Frontend API**: `api/authApi.ts` — deprecar o migrar.
- **Potenciales breaking changes**: Cualquier código que use `user.rol` (singular) va a romper. Hay que actualizar todos los references a `user.rol` por `user.roles`.
