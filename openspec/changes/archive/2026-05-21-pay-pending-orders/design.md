## Context

El frontend ya tiene el flujo de pago completo en el **CartDrawer**: crea el pedido, muestra PaymentForm con el brick CardPayment de MercadoPago, envía el token a `POST /api/v1/pagos/crear`, y hace polling hasta obtener estado terminal.

El backend ya soporta el pago para **cualquier pedido**, no solo el recién creado. El endpoint `POST /api/v1/pagos/crear` recibe `{ card_token, pedido_id }` sin validar que el pedido sea "recién creado". El webhook de MP transiciona el estado a "pagado" cuando corresponde.

El gap está solo en el frontend: el modal de detalle de **MisPedidos** muestra toda la info del pedido pero no ofrece acción de pago para pedidos en estado "pendiente".

## Goals / Non-Goals

**Goals:**
- Permitir al cliente pagar un pedido en estado "pendiente" desde el modal de detalle de MisPedidos
- Reutilizar `PaymentForm.tsx`, `useCreatePayment`, `usePagoByPedido`, y `paymentStore` sin modificaciones
- Mantener la experiencia dentro del modal existente (sin redirecciones a nuevas rutas)
- Refrescar la lista de pedidos al cerrar el modal después de un pago exitoso

**Non-Goals:**
- No se agregan nuevas rutas ni páginas
- No se modifican componentes existentes fuera de MisPedidos
- No se cambia el backend ni los endpoints de pago
- No se implementa reintento de pago para pedidos con payment_status "rejected" (se cubre en otro cambio si aplica)

## Decisions

| Decisión | Opción elegida | Alternativa | Por qué |
|----------|---------------|-------------|---------|
| Dónde mostrar el pago | En el mismo modal de detalle | Nueva ruta `/checkout/pay/:orderId` | El modal ya tiene el contexto completo del pedido. No requiere navegación, no rompe el flujo actual. El brick de MP se renderiza bien dentro del modal existente (600px, 80vh). |
| Cómo manejar el estado del pago | Resetear `paymentStore` al abrir | Store separado para MisPedidos | `paymentStore` es global y su estado es efímero (solo dura lo que dura el intento de pago). Reseteamos al mostrar el formulario. No necesita store separado. |
| Cómo refrescar la lista al cerrar | `refetch()` de `useOrders` al cerrar modal si hubo pago exitoso | Recarga completa de página | `useOrders` ya expone `refetch()` del hook. Solo refresca si efectivamente se pagó (evita llamadas innecesarias a la API). |

### Flujo detallado

```
MisPedidos
  │
  ├─ Lista de pedidos (useOrders)
  │    └─ "Ver Detalle" → setSelectedOrderId(id)
  │
  └─ Modal de detalle (useOrderById)
       │
       ├─ Muestra info del pedido + items + historial
       │
       ├─ [Si estado === "pendiente" y !showPayment]
       │    └─ Botón "Pagar ahora"
       │         └─ onClick:
       │              1. paymentStore.reset()
       │              2. setShowPayment(true)
       │
       └─ [Si showPayment]
            └─ PaymentForm
                 ├─ totalInCents = orderDetail.total
                 ├─ onPayment = handlePaymentToken
                 │    ├─ paymentStore.setProcessing()
                 │    ├─ POST /api/v1/pagos/crear { card_token, pedido_id }
                 │    └─ setPollingEnabled(true)
                 │
                 └─ Polling: usePagoByPedido(orderId, pollingEnabled)
                      └─ useEffect detecta mp_status:
                           ├─ "approved" → paymentStore.setApproved()
                           ├─ "rejected" → paymentStore.setRejected()
                           └─ (cualquier terminal) → setPollingEnabled(false)

  ── Al cerrar modal:
       └─ Si paymentStore.status === "approved" → refetch() orders list
       └─ setShowPayment(false), setSelectedOrderId(null), paymentStore.reset()
```

### Estados del modal

| Estado | Qué se muestra |
|--------|---------------|
| `showPayment = false` | Detalle del pedido normal + botón "Pagar ahora" (si aplica) |
| `showPayment = true` + `status === 'idle'` | PaymentForm con CardPayment brick |
| `showPayment = true` + `status === 'processing'` | CardPayment brick + spinner "Procesando pago..." |
| `showPayment = true` + `status === 'approved'` | Pantalla de éxito con check verde |
| `showPayment = true` + `status === 'rejected'` | Pantalla de rechazo + botón "Reintentar" que vuelve al form |
| `showPayment = true` + `status === 'error'` | Pantalla de error + botón "Reintentar" |

### Botón "Reintentar"

Si el pago falla (rejected o error), se muestra un botón "Reintentar" que:
1. Resetea el paymentStore
2. Mantiene `showPayment = true`
3. El formulario CardPayment se vuelve a renderizar para que el usuario ingrese otros datos de tarjeta

## Riesgos / Trade-offs

- **Riesgo**: El `paymentStore` tiene estado global compartido con CartDrawer. Si el usuario inicia un pago desde MisPedidos y luego abre CartDrawer, podría haber contaminación de estado.
  → **Mitigación**: Siempre se resetea el store al mostrar el pago desde cualquier lugar. Ambos flujos (CartDrawer y MisPedidos) llaman `paymentStore.reset()` antes de empezar.

- **Riesgo**: El brick CardPayment necesita montarse en el DOM. Si el modal se cierra mientras el brick está cargando, puede dejar referencias colgadas.
  → **Mitigación**: React desmonta el componente al salir de `showPayment`, y el SDK de MP maneja su propio cleanup.

- **Trade-off**: No se extrae lógica compartida (el flujo de pago está duplicado entre CartDrawer y MisPedidos).
  → Es intencional: la lógica es ~15 líneas de efecto + handler. Extraerla a un hook compartido agrega complejidad innecesaria para el tamaño del proyecto. Si aparece un tercer lugar que necesite pagar, se extrae en ese momento (Rule of Three).
