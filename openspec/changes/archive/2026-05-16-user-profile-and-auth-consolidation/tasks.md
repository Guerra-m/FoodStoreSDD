## 1. Backend — Endpoint PATCH /api/v1/auth/me

- [ ] 1.1 Agregar ruta `update_me` en `router.py` de `modules/usuarios` que reciba `ClientePerfilUpdate` e invoque `cliente_service.actualizar_perfil()`
- [ ] 1.2 Verificar que la respuesta usa `UserResponse` (ya tiene todos los campos: roles, telefono, foto_url, fecha_nacimiento)

## 2. Frontend — Type User actualizado

- [ ] 2.1 En `types/auth.ts`, cambiar `rol: string` por `roles: string[]`
- [ ] 2.2 Agregar campos faltantes: `telefono`, `foto_url`, `fecha_nacimiento`, `actualizado_en`
- [ ] 2.3 Actualizar `LoginResponse` si es necesario para que coincida con el backend

## 3. Frontend — AuthStore tipado y persistencia

- [ ] 3.1 Importar `User` type de `../types/auth` en `authStore.ts`
- [ ] 3.2 Cambiar `user: any | null` por `user: User | null`
- [ ] 3.3 Modificar `partialize` para que persista también `user` (no solo `accessToken`)
- [ ] 3.4 Cambiar `setAuth` parameter type de `any` a `User`

## 4. Frontend — Migrar AuthContext a customers.ts (nuevo sistema)

- [ ] 4.1 Verificar que `customers.ts` tenga los endpoints necesarios (login, register, refresh, logout, me) — si no, agregarlos
- [ ] 4.2 Cambiar imports en `AuthContext.tsx` de `authApi.ts` a `customers.ts`
- [ ] 4.3 Verificar que `login()`, `register()`, `logout()`, `handleRefreshToken()`, `restoreSession()` funcionan con el nuevo sistema

## 5. Frontend — user.rol → user.roles en toda la app

- [ ] 5.1 Buscar todos los references a `user.rol` y `user?.rol` en el frontend
- [ ] 5.2 `Sidebar.tsx`: cambiar `user?.rol === 'Admin'` por `user?.roles?.includes('Admin')`
- [ ] 5.3 `ProtectedRoute.tsx`: verificar que `allowedRoles` funcione con el nuevo `roles: string[]`
- [ ] 5.4 `AdminLayout.tsx` o similar: actualizar verificación de rol Admin
- [ ] 5.5 Cualquier otro componente con `user.rol`

## 6. Frontend — Profile page (MiPerfil)

- [ ] 6.1 Verificar que `MiPerfil.tsx` muestra correctamente los campos nuevos (telefono, foto_url, fecha_nacimiento)
- [ ] 6.2 Verificar que el formulario de edición envía los datos correctamente al PATCH /api/v1/auth/me
- [ ] 6.3 Verificar que al actualizar el perfil, el store y el context reflejan los cambios

## 7. Deprecación (opcional)

- [ ] 7.1 Marcar `authApi.ts` como deprecated con comentario
- [ ] 7.2 Verificar que nada más importa de `authApi.ts` después de la migración
