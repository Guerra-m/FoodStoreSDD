## 1. Preparación

- [ ] 1.1 Crear directorios target: `api/`, `hooks/`, `components/`, `stores/`
- [ ] 1.2 Verificar con `npm run build` que el proyecto compila antes de empezar (baseline)

## 2. Mover `shared/api/` → `api/`

- [ ] 2.1 Mover `shared/api/addressApi.ts` → `api/address.ts` (con `git mv`)
- [ ] 2.2 Mover `shared/api/adminApi.ts` → `api/admin.ts` (con `git mv`)
- [ ] 2.3 Mover `shared/api/axios.ts` → `api/axios.ts` (con `git mv`)
- [ ] 2.4 Mover `shared/api/categoryApi.ts` → `api/categories.ts` (con `git mv`)
- [ ] 2.5 Mover `shared/api/customerApi.ts` → `api/customers.ts` (con `git mv`)
- [ ] 2.6 Mover `shared/api/ingredientApi.ts` → `api/ingredients.ts` (con `git mv`)
- [ ] 2.7 Mover `shared/api/orderApi.ts` → `api/orders.ts` (con `git mv`)
- [ ] 2.8 Mover `shared/api/pagoApi.ts` → `api/pagos.ts` (con `git mv`)
- [ ] 2.9 Mover `shared/api/productApi.ts` → `api/products.ts` (con `git mv`)

## 3. Mover `shared/hooks/` → `hooks/`

- [ ] 3.1 Mover `shared/hooks/useCategories.ts` → `hooks/useCategories.ts` (con `git mv`)
- [ ] 3.2 Mover `shared/hooks/useCustomerProfile.ts` → `hooks/useCustomerProfile.ts` (con `git mv`)
- [ ] 3.3 Mover `shared/hooks/useDirecciones.ts` → `hooks/useDirecciones.ts` (con `git mv`)
- [ ] 3.4 Mover `shared/hooks/useIngredientes.ts` → `hooks/useIngredientes.ts` (con `git mv`)
- [ ] 3.5 Mover `shared/hooks/useMinDelay.ts` → `hooks/useMinDelay.ts` (con `git mv`)
- [ ] 3.6 Mover `shared/hooks/useOrders.ts` → `hooks/useOrders.ts` (con `git mv`)
- [ ] 3.7 Mover `shared/hooks/usePago.ts` → `hooks/usePago.ts` (con `git mv`)
- [ ] 3.8 Mover `shared/hooks/useProducts.ts` → `hooks/useProducts.ts` (con `git mv`)
- [ ] 3.9 Mover `shared/hooks/useToast.ts` → `hooks/useToast.ts` (con `git mv`)
- [ ] 3.10 Mover `shared/hooks/tests/usePago.test.ts` → `hooks/tests/usePago.test.ts` (con `git mv`)

## 4. Mover `shared/components/` → `components/`

- [ ] 4.1 Mover `shared/components/OrderSummaryCard.tsx` → `components/OrderSummaryCard.tsx` (con `git mv`)
- [ ] 4.2 Mover `shared/components/PaymentForm.tsx` → `components/PaymentForm.tsx` (con `git mv`)
- [ ] 4.3 Mover `shared/components/PaymentResultScreen.tsx` → `components/PaymentResultScreen.tsx` (con `git mv`)
- [ ] 4.4 Mover `shared/components/Skeleton.tsx` → `components/Skeleton.tsx` (con `git mv`)
- [ ] 4.5 Mover `shared/components/SkeletonCard.tsx` → `components/SkeletonCard.tsx` (con `git mv`)
- [ ] 4.6 Mover `shared/components/SkeletonDetail.tsx` → `components/SkeletonDetail.tsx` (con `git mv`)
- [ ] 4.7 Mover `shared/components/SkeletonTable.tsx` → `components/SkeletonTable.tsx` (con `git mv`)

## 5. Mover `shared/stores/` → `stores/`

- [ ] 5.1 Mover `shared/stores/addressStore.ts` → `stores/addressStore.ts` (con `git mv`)
- [ ] 5.2 Mover `shared/stores/authStore.ts` → `stores/authStore.ts` (con `git mv`)
- [ ] 5.3 Mover `shared/stores/cartStore.ts` → `stores/cartStore.ts` (con `git mv`)
- [ ] 5.4 Mover `shared/stores/categoryStore.ts` → `stores/categoryStore.ts` (con `git mv`)
- [ ] 5.5 Mover `shared/stores/paymentStore.ts` → `stores/paymentStore.ts` (con `git mv`)
- [ ] 5.6 Mover `shared/stores/productStore.ts` → `stores/productStore.ts` (con `git mv`)
- [ ] 5.7 Mover `shared/stores/uiStore.ts` → `stores/uiStore.ts` (con `git mv`)
- [ ] 5.8 Mover `shared/stores/tests/paymentStore.test.ts` → `stores/tests/paymentStore.test.ts` (con `git mv`)

## 6. Actualizar imports en archivos del proyecto

- [ ] 6.1 Actualizar imports en `app/App.tsx` (`shared/stores/cartStore` y `shared/stores/uiStore` → `stores/`)
- [ ] 6.2 Actualizar imports en `app/components/AddressCard.tsx` (`shared/api/addressApi` → `api/address`)
- [ ] 6.3 Actualizar imports en `app/components/AddressFormModal.tsx` (`shared/api/addressApi` → `api/address`)
- [ ] 6.4 Actualizar imports en `app/pages/admin/DashboardPage.tsx` (`shared/api/adminApi` → `api/admin`, `shared/components/Skeleton` → `components/Skeleton`, `shared/components/SkeletonTable` → `components/SkeletonTable`)
- [ ] 6.5 Actualizar imports en `app/pages/admin/OrderDetailPage.tsx` (`shared/api/adminApi` → `api/admin`)
- [ ] 6.6 Actualizar imports en `app/pages/admin/OrdersPage.tsx` (`shared/api/adminApi` → `api/admin`, `shared/components/SkeletonTable` → `components/SkeletonTable`)
- [ ] 6.7 Actualizar imports en `app/pages/admin/UsersPage.tsx` (`shared/api/adminApi` → `api/admin`, `shared/components/SkeletonTable` → `components/SkeletonTable`)
- [ ] 6.8 Actualizar imports en `app/pages/Catalogo.tsx` (`shared/hooks/useProducts` → `hooks/useProducts`, `shared/hooks/useCategories` → `hooks/useCategories`, `shared/stores/cartStore` → `stores/cartStore`, `shared/components/SkeletonCard` → `components/SkeletonCard`)
- [ ] 6.9 Actualizar imports en `app/pages/Categorias.tsx` (`shared/hooks/useCategories` → `hooks/useCategories`, `shared/api/categoryApi` → `api/categories`)
- [ ] 6.10 Actualizar imports en `app/pages/MiPerfil.tsx` (`shared/hooks/useCustomerProfile` → `hooks/useCustomerProfile`, `shared/hooks/useDirecciones` → `hooks/useDirecciones`, `shared/api/addressApi` → `api/address`)
- [ ] 6.11 Actualizar imports en `app/pages/MisPedidos.tsx` (`shared/hooks/useOrders` → `hooks/useOrders`, `shared/api/orderApi` → `api/orders`, `shared/components/SkeletonTable` → `components/SkeletonTable`)
- [ ] 6.12 Actualizar imports en `app/pages/OrderConfirmationPage.tsx` (`shared/hooks/useOrders` → `hooks/useOrders`, `shared/components/OrderSummaryCard` → `components/OrderSummaryCard`, `shared/components/SkeletonDetail` → `components/SkeletonDetail`)
- [ ] 6.13 Actualizar imports en `app/pages/PaymentResultPage.tsx` (`shared/stores/paymentStore` → `stores/paymentStore`, `shared/components/PaymentResultScreen` → `components/PaymentResultScreen`, `shared/api/pagoApi` → `api/pagos`)
- [ ] 6.14 Actualizar imports en `app/pages/ProductoDetalle.tsx` (`shared/hooks/useProducts` → `hooks/useProducts`, `shared/components/SkeletonDetail` → `components/SkeletonDetail`)
- [ ] 6.15 Actualizar imports en `app/pages/Productos.tsx` (`shared/hooks/useProducts` → `hooks/useProducts`, `shared/hooks/useCategories` → `hooks/useCategories`, `shared/hooks/useIngredientes` → `hooks/useIngredientes`, `shared/api/productApi` → `api/products`)
- [ ] 6.16 Actualizar imports en `features/auth/components/ProtectedRoute.tsx` (`shared/stores/authStore` → `stores/authStore`)
- [ ] 6.17 Actualizar imports en `features/auth/context/AuthContext.tsx` (`shared/stores/authStore` → `stores/authStore`)
- [ ] 6.18 Actualizar imports en `features/shopping-cart/components/AddToCartButton.tsx` (`shared/stores/cartStore` → `stores/cartStore`)
- [ ] 6.19 Actualizar imports en `features/shopping-cart/components/CartDrawer.tsx` (`shared/stores/cartStore` → `stores/cartStore`, `shared/stores/paymentStore` → `stores/paymentStore`, `shared/stores/uiStore` → `stores/uiStore`, `shared/hooks/useDirecciones` → `hooks/useDirecciones`, `shared/hooks/useOrders` → `hooks/useOrders`, `shared/hooks/usePago` → `hooks/usePago`, `shared/api/orderApi` → `api/orders`, `shared/components/PaymentForm` → `components/PaymentForm`)
- [ ] 6.20 Actualizar imports en `features/shopping-cart/components/CartItemCard.tsx` (`shared/stores/cartStore` → `stores/cartStore`)
- [ ] 6.21 Actualizar imports en `features/shopping-cart/components/CartSummary.tsx` (`shared/stores/cartStore` → `stores/cartStore`)
- [ ] 6.22 Actualizar imports en `features/shopping-cart/hooks/useCartCrossTabSync.ts` (`shared/stores/cartStore` → `stores/cartStore`)
- [ ] 6.23 Actualizar imports en `features/shopping-cart/tests/cartStore.integration.test.ts` (`shared/stores/cartStore` → `stores/cartStore`)
- [ ] 6.24 Actualizar imports en `features/shopping-cart/tests/cartStore.test.ts` (`shared/stores/cartStore` → `stores/cartStore`)

## 7. Verificar y limpiar

- [ ] 7.1 Verificar que NO queden referencias a `shared/` con `Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "shared/"` (debe dar 0 resultados)
- [ ] 7.2 Ejecutar `npm run build` en frontend para detectar errores de compilación
- [ ] 7.3 Ejecutar `npm test` en frontend para verificar que los tests pasan
- [ ] 7.4 Eliminar la carpeta `shared/` una vez vacía y confirmada
