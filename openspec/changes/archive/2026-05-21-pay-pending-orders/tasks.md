## 1. Agregar estado de pago y polling en MisPedidos

- [x] 1.1 Agregar imports: `PaymentForm`, `usePaymentStore`, `useCreatePayment`, `usePagoByPedido`, `useEffect` y `useRef`
- [x] 1.2 Agregar estados locales: `showPayment` (boolean), `pollingEnabled` (boolean)
- [x] 1.3 Integrar `useCreatePayment` mutation y `usePagoByPedido` hook con polling condicional
- [x] 1.4 Implementar `handlePaymentToken(token)` que setea processing, llama a crear pago, y activa polling
- [x] 1.5 Implementar `useEffect` que escuche `pagoData` y actualice `paymentStore` según mp_status (approved/rejected)

## 2. Agregar botón "Pagar ahora" en el modal de detalle

- [x] 2.1 Mostrar botón "Pagar ahora" cuando `estado === 'pendiente'` y `!showPayment`
- [x] 2.2 Al hacer clic: resetear `paymentStore`, setear `showPayment = true`
- [x] 2.3 Renderizar condicionalmente: si `showPayment` → PaymentForm con `totalInCents={orderDetail.total}` y `onPayment={handlePaymentToken}`, si no → detalle normal

## 3. Manejo de estados terminales y "Reintentar"

- [x] 3.1 Cuando paymentStore.status es "approved" o "rejected", PaymentForm ya muestra su pantalla terminal
- [x] 3.2 Agregar botón "Reintentar" cuando status es "rejected" o "error": resetea paymentStore, mantiene showPayment
- [x] 3.3 Al cerrar modal: si status === "approved" → ejecutar `refetch()` de useOrders, resetear paymentStore, setShowPayment(false), setSelectedOrderId(null)

## 4. Verificación

- [x] 4.1 Verificar que TypeScript compile sin errores (`npx tsc --noEmit`)
- [ ] 4.2 Verificar que el botón "Pagar ahora" NO aparezca para pedidos ya pagados, cancelados o en otro estado
- [ ] 4.3 Verificar que el flujo de reintento funcione (rechazar → reintentar → nuevo formulario)
- [ ] 4.4 Verificar que al cerrar el modal post-pago exitoso, la lista de pedidos refleje el cambio
