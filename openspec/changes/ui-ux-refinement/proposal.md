## Why

La aplicación es completamente funcional pero la experiencia de usuario es básica: los estados de carga son textos planos ("Cargando..."), no hay feedback visual para acciones (toasts), la confirmación del pedido es abrupta, y el retorno de MercadoPago no tiene una pantalla de resultado clara. Esto hace que la app se sienta como un "trabajo práctico" en vez de un producto profesional. Este change pone el pulido final para que la experiencia sea fluida y cuidada.

## What Changes

- **Skeleton loading components**: Reemplazar los textos "Cargando..." por skeletons animados en todas las páginas (catálogo, pedidos, perfil, admin).
- **Sistema de toasts**: Agregar un sistema de notificaciones toast para feedback visual de acciones (producto agregado al carrito, pedido creado, error, etc.).
- **Pantalla de confirmación de pedido**: Después de crear un pedido exitosamente, mostrar una pantalla de confirmación visual con el resumen y número de pedido.
- **Feedback de retorno de MercadoPago**: Mejorar la pantalla de retorno después del pago con estados claros (aprobado, rechazado, pendiente) y acciones según el resultado.
- **Refactor de uiStore**: Ampliar el store de UI para soportar toasts y reutilizarlo en lugar de manejar estados inline.

## Capabilities

### New Capabilities
- `loading-skeleton`: Componentes de skeleton animados para reemplazar loading text en toda la app. Incluye variantes para cards, tablas, detalle de producto, y formularios.
- `notifications`: Sistema de toasts con tipos (success, error, warning, info), duración configurable, cola de notificaciones, y posición personalizable.
- `order-confirmation`: Pantalla de confirmación visual post-creación de pedido con resumen, datos de entrega, estado de pago, y acciones siguientes.
- `payment-feedback`: Pantalla de resultado de pago con estado visual (aprobado/rechazado/pendiente), detalles de transacción, y botones de acción.

### Modified Capabilities
<!-- No hay cambios en requerimientos a nivel spec. Todo es UI/UX adicional que no altera contracts existentes. -->

## Impact

- **Frontend**: Modificaciones en `frontend/src/shared/stores/uiStore.ts` (ampliar para toasts), creación de componentes compartidos en `frontend/src/shared/components/`, y actualización de páginas existentes para usar skeletons y toasts.
- **No afecta backend**: Este change es 100% frontend. No hay cambios en APIs, schemas de DB, ni lógica de negocio.
- **No breaking changes**: Todo es aditivo. Las páginas existentes siguen funcionando.
