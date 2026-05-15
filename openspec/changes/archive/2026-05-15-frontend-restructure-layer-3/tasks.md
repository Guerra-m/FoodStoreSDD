## 1. Preparación

- [x] 1.1 Verificar que el working tree esté limpio (`git status`)
- [x] 1.2 Crear directorios destino faltantes: `context/`, `utils/`, `components/auth/`, `components/shopping-cart/`

## 2. Migrar `features/auth/` → destino

- [x] 2.1 Mover `features/auth/services/authApi.ts` → `api/authApi.ts`
- [x] 2.2 Mover `features/auth/hooks/useAuth.ts` → `hooks/useAuth.ts`
- [x] 2.3 Mover `features/auth/components/LoginForm.tsx` → `components/auth/LoginForm.tsx`
- [x] 2.4 Mover `features/auth/components/LoginForm.module.css` → `components/auth/LoginForm.module.css`
- [x] 2.5 Mover `features/auth/components/LogoutButton.tsx` → `components/auth/LogoutButton.tsx`
- [x] 2.6 Mover `features/auth/components/LogoutButton.module.css` → `components/auth/LogoutButton.module.css`
- [x] 2.7 Mover `features/auth/components/ProtectedRoute.tsx` → `components/auth/ProtectedRoute.tsx`
- [x] 2.8 Mover `features/auth/components/RegisterForm.tsx` → `components/auth/RegisterForm.tsx`
- [x] 2.9 Mover `features/auth/components/RegisterForm.module.css` → `components/auth/RegisterForm.module.css`
- [x] 2.10 Mover `features/auth/context/AuthContext.tsx` → `context/AuthContext.tsx`
- [x] 2.11 Mover `features/auth/types.ts` → `types/auth.ts`
- [x] 2.12 Mover `features/auth/utils.ts` → `utils/auth.ts`
- [x] 2.13 Mover `features/auth/tests/auth.test.ts` → `components/auth/tests/auth.test.ts`
- [x] 2.14 Mover `features/auth/tests/security-verify.test.ts` → `components/auth/tests/security-verify.test.ts`

## 3. Migrar `features/shopping-cart/` → destino

- [x] 3.1 Mover `features/shopping-cart/components/AddToCartButton.tsx` → `components/shopping-cart/AddToCartButton.tsx`
- [x] 3.2 Mover `features/shopping-cart/components/CartDrawer.tsx` → `components/shopping-cart/CartDrawer.tsx`
- [x] 3.3 Mover `features/shopping-cart/components/CartItemCard.tsx` → `components/shopping-cart/CartItemCard.tsx`
- [x] 3.4 Mover `features/shopping-cart/components/CartSummary.tsx` → `components/shopping-cart/CartSummary.tsx`
- [x] 3.5 Mover `features/shopping-cart/hooks/useCartCrossTabSync.ts` → `hooks/useCartCrossTabSync.ts`
- [x] 3.6 Mover `features/shopping-cart/types.ts` → `types/shopping-cart.ts`
- [x] 3.7 Mover `features/shopping-cart/tests/cartStore.test.ts` → `stores/tests/cartStore.test.ts`
- [x] 3.8 Mover `features/shopping-cart/tests/cartStore.integration.test.ts` → `stores/tests/cartStore.integration.test.ts`

## 4. Migrar `features/admin/` → destino

- [x] 4.1 Mover `features/admin/types.ts` → `types/admin.ts`

## 5. Actualizar imports migrados

- [x] 5.1 Actualizar imports en `features/` → las nuevas rutas (archivos se movieron, sus propios imports relativos cambian)
- [x] 5.2 Buscar y actualizar todos los imports externos a `features/` en toda la aplicación (`src/`) usando `grep -r "features/"`

## 6. Limpieza y verificación

- [x] 6.1 Verificar que no queden archivos bajo `features/` (`Get-ChildItem features/ -Recurse -File`)
- [x] 6.2 Eliminar la carpeta `features/` vacía
- [x] 6.3 Verificar compilación con `npx tsc --noEmit` o `npm run build` (errores pre-existentes no relacionados)
- [x] 6.4 Verificar cero ocurrencias de `features/` en imports (`grep -r "features/" src/`)
