## 1. UI Store Ampliación

- [x] 1.1 Extender `uiStore` (uiStore.ts) agregando estado y acciones para manejo programático de UI global si es necesario
- [x] 1.2 Crear hook `useMinDelay` que garantice mínimo 300ms de display para evitar flicker en skeletons

## 2. Sistema de Skeletons

- [x] 2.1 Crear componente `Skeleton` primitivo con props `shape` (rect | circle | text), `width`, `height`, `className` y animación `animate-pulse`
- [x] 2.2 Crear componente `SkeletonCard` para grids de productos (imagen 16:9, título, descripción, precio)
- [x] 2.3 Crear componente `SkeletonTable` para tablas con props `rows` (default 5) y `columns` configurable
- [x] 2.4 Crear componente `SkeletonDetail` para páginas de detalle (imagen grande + líneas de texto)
- [x] 2.5 Reemplazar loading text en `Catalogo.tsx` por `SkeletonCard` (grid de 6 skeletons)
- [x] 2.6 Reemplazar loading text en `ProductoDetalle.tsx` por `SkeletonDetail`
- [x] 2.7 Reemplazar loading text en `MisPedidos.tsx` por `SkeletonTable` (lista + modal de detalle)
- [x] 2.8 Reemplazar loading text en páginas admin (`OrdersPage.tsx`, `UsersPage.tsx`, `DashboardPage.tsx`) por `SkeletonTable`
- [x] 2.9 Agregar `aria-busy="true"` y `aria-label` en contenedores con skeletons para accesibilidad

## 3. Sistema de Notificaciones (Toasts)

- [x] 3.1 Configurar `ToastContainer` de react-toastify en `App.tsx` con `position="bottom-right"`, `autoClose={3000}`, `theme="light"`
- [x] 3.2 Crear hook `useToast` que exponga funciones `success`, `error`, `warning`, `info`
- [x] 3.3 Agregar toast success al agregar producto al carrito ("<nombre> agregado al carrito")
- [x] 3.4 Agregar toast success al crear pedido ("Pedido #<id> creado con éxito")
- [x] 3.5 Agregar error toasts en catches de API calls del catálogo y creación de pedido

## 4. Pantalla de Confirmación de Pedido

- [x] 4.1 Crear componente `OrderSummaryCard` reutilizable con items, total, dirección y badges de estado
- [x] 4.2 Crear página `OrderConfirmationPage` con header de éxito (checkmark + "¡Pedido confirmado!"), resumen del pedido, y skeletons en loading
- [x] 4.3 Agregar ruta `/order-confirmation/:orderId` en `App.tsx`
- [x] 4.4 Implementar redirect a `/order-confirmation/:id` tras creación exitosa de pedido + limpiar carrito
- [x] 4.5 Agregar botones de acción en confirmación: "Ver mis pedidos" → `/mis-pedidos`, "Seguir comprando" → `/catalog`

## 5. Feedback de MercadoPago

- [x] 5.1 Crear componente `PaymentResultScreen` con variantes visuales para approved, rejected, error y pending
- [x] 5.2 Crear ruta `/payment-result` que parsea query params (`status`, `payment_id`, `external_reference`) de MercadoPago
- [x] 5.4 Implementar polling de estado de pago cada 5 segundos cuando status es "pending" (timeout 2 min)
- [x] 5.5 Implementar flujo de reintento: botón "Intentar de nuevo" resetea paymentStore y muestra el formulario de pago
- [x] 5.3 Integrar `back_urls` de MercadoPago apuntando a `/payment-result` en la creación de preferencia (requiere cambios en backend)
