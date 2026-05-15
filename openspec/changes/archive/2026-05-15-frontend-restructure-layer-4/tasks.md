## 1. Migrar utilidades a lib/

- [x] 1.1 Crear directorio `frontend/src/lib/`
- [x] 1.2 Mover `frontend/src/utils/auth.ts` → `frontend/src/lib/auth.ts`
- [x] 1.3 Actualizar import en `context/AuthContext.tsx` (de `../utils/auth` a `../lib/auth`)
- [x] 1.4 Actualizar import en `components/auth/LoginForm.tsx` (de `../../utils/auth` a `../../lib/auth`)
- [x] 1.5 Actualizar import en `components/auth/RegisterForm.tsx` (de `../../utils/auth` a `../../lib/auth`)
- [x] 1.6 Actualizar import en `components/auth/tests/auth.test.ts` (de `../../../utils/auth` a `../../../lib/auth`)
- [x] 1.7 Eliminar directorio `frontend/src/utils/` (vacío tras migración)
- [x] 1.8 Verificar build: ejecutar `npm run build` y corroborar que no haya errores de import (errores pre-existentes en App.tsx y OrderDetailPage.tsx no relacionados)

## 2. Crear assets/

- [x] 2.1 Crear directorio `frontend/src/assets/`
- [x] 2.2 Agregar `.gitkeep` para mantener el directorio en el repo

## 3. Verificar types/ centralizado

- [x] 3.1 Confirmar que `frontend/src/types/` contiene todas las definiciones de tipos del frontend (`admin.ts`, `auth.ts`, `shopping-cart.ts`)
- [x] 3.2 Verificar que no haya tipos dispersos en otras carpetas (components/, hooks/, stores/, api/, pages/) — no se encontraron tipos fuera de types/

## 4. Limpiar archivos stale de la raíz

- [x] 4.1 Eliminar `AUTHORIZATION.md`
- [x] 4.2 Eliminar `AUTH_README.md`
- [x] 4.3 Eliminar `CHANGE_8_ANALYSIS.md`
- [x] 4.4 Eliminar `CHANGE_8_ARCHIVED.md`
- [x] 4.5 Eliminar `CHANGE_8_COMPLETE.md`
- [x] 4.6 Eliminar `CHANGE_8_SUMMARY.md`
- [x] 4.7 Eliminar `SECURITY_VALIDATION.md`
- [x] 4.8 Confirmar que los archivos ya no existen en el working tree
