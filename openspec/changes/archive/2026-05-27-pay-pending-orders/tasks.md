## 1. Implementar pago en MisPedidos

- [x] 1.1 Agregar imports de `PaymentForm`, `usePaymentStore`, `useCreatePayment`, `usePagoByPedido` en `MisPedidos.tsx`
- [x] 1.2 Agregar estado `showPayment`, `pollingEnabled`, y handlers `handlePaymentToken`, `handleStartPayment`, `handleRetry`, `handleCloseModal`
- [x] 1.3 Agregar `useEffect` para polling de estado de pago (escuchar `pagoData` y actualizar paymentStore)
- [x] 1.4 Modificar el modal para alternar entre vista detalle y vista pago según `showPayment`
- [x] 1.5 Agregar botón "Pagar ahora" en la vista detalle cuando `estado === 'pendiente'`
- [x] 1.6 Agregar vista de pago con `PaymentForm` y botón de reintentar en caso de error/rechazo
- [x] 1.7 Refrescar lista de pedidos al cerrar modal si el pago fue aprobado
