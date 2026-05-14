## Exploration: MercadoPago Integration

### Current State

**Orders FSM**: Completamente implementado. 6 estados (pendiente, pagado, preparando, enviado, entregado, cancelado). El action `pagar` transiciona `pendiente→pagado` y está autorizado para roles `Admin` y `Sistema`. Exactamente lo que necesita el webhook de MercadoPago para avanzar el pedido cuando el pago es aprobado. Audit trail append-only funcionando, stock restoration en cancelación también.

**Order Creation**: Atómica via UoW con validación de stock (SELECT FOR UPDATE), snapshots de precios y dirección, registro de historial inicial. El frontend en `CartDrawer.tsx` ya tiene un flujo de checkout que crea el pedido pero termina en "Pedido creado exitosamente" — **sin paso de pago**. No hay integración con MP en el checkout.

**Payment Model**: **No existe**. No hay modelo `Pago`, no hay tabla en BD, no hay migración Alembic. El documento `docs/Integrador.txt` describe en detalle la estructura planeada (mp_payment_id, mp_status, external_reference, idempotency_key) pero nada está implementado.

**External Integrations**: No existe ninguna integración con APIs externas en el código actual. El SDK de MP (`mercadopago==2.3.0`) ya está en `requirements.txt` pero no está configurado ni importado. Las variables de entorno `MERCADOPAGO_ACCESS_TOKEN` y `VITE_MERCADOPAGO_PUBLIC_KEY` están en `.env.example` pero no en la clase `Settings` de backend.

**Frontend Checkout**: La página de checkout es inline en `CartDrawer.tsx` dentro del drawer del carrito. No hay página de checkout separada. El `paymentStore.ts` es un esqueleto de 11 líneas con solo status idle/processing/approved/rejected/error. No hay `@mercadopago/sdk-react` instalado.

**Architecture Pattern**: Backend usa Router → Service → Repository → Model con UoW, patrón claro y repetible para el módulo `pagos`. Frontend usa TanStack Query para datos del servidor, Zustand para estado del cliente, Axios con interceptors JWT.

### Affected Areas

- `backend/app/modules/pedidos/fsm.py` — Ya tiene la acción "pagar" que el webhook usará. No requiere cambios, pero hay que verificar que el rol "Sistema" funcione sin usuario autenticado (el webhook de MP llega sin JWT).
- `backend/app/modules/pedidos/service.py` — El método `transicionar_estado` con accion="pagar" y rol="Sistema" será invocado por el webhook.
- `backend/app/modules/pedidos/model.py` — El modelo `Pedido` necesita una relación al `Pago` (one-to-many o one-to-one).
- `backend/app/modules/pedidos/schema.py` — `PedidoResponse` debería incluir info de pago.
- `backend/app/core/config.py` — Hay que agregar `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_NOTIFICATION_URL`.
- `backend/main.py` — Registrar router del módulo `pagos`.
- `backend/alembic/versions/` — Nueva migración para tabla `Pago`.
- `backend/requirements.txt` — `mercadopago==2.3.0` ya está, verificar si hace falta actualizar.
- `frontend/package.json` — Instalar `@mercadopago/sdk-react`.
- `frontend/src/features/shopping-cart/components/CartDrawer.tsx` — Agregar paso de pago con MP después de crear el pedido.
- `frontend/src/shared/stores/paymentStore.ts` — Expandir con mpPaymentId, statusDetail, métodos reset/set.
- `frontend/src/shared/api/` — Nueva API layer para pagos.
- `frontend/src/shared/hooks/` — Nuevos hooks usePayment, useCreatePayment.
- `frontend/src/app/pages/MisPedidos.tsx` — Mostrar estado de pago en detalle del pedido.
- `frontend/.env.example` — Ya tiene VITE_MERCADOPAGO_PUBLIC_KEY.
- `backend/.env.example` — Ya tiene MERCADOPAGO_ACCESS_TOKEN.

### Approaches

1. **Full Checkout API con CardPayment embebido** — Usar `@mercadopago/sdk-react` con el componente `<CardPayment />` embebido en el checkout flow. El frontend tokeniza la tarjeta, envía el token al backend que crea la preferencia de pago. Webhook IPN procesa el resultado.  
   - Pros: Mejor UX (no redirige), PCI SAQ-A compliant, flujo completo dentro de la app  
   - Cons: Más complejidad frontend, requiere manejar estados de pago en tiempo real  
   - Effort: **High**

2. **Checkout Pro con redirect** — Usar la Checkout Pro de MP que redirige al usuario a la página de MP y vuelve via callback.  
   - Pros: Mucho más simple, MP maneja todo el UI de pago, mínimo código frontend  
   - Cons: UX pobre (sale de la app), no cumple con la especificación del Integrador.txt que pide CardPayment embebido  
   - Effort: **Low-Medium**

3. **Híbrido: CardPayment para tarjetas + redirección para otros medios** — Usar CardPayment embedido como opción principal, y ofrecer otros medios (Rapipago, Pago Fácil) que requieran redirect.  
   - Pros: Cubre todos los medios de pago, mejor UX para tarjetas  
   - Cons: Más código, dos flujos de pago distintos  
   - Effort: **High**

### Recommendation

**Approach 1 (Full Checkout API con CardPayment embebido)** — Es el que está especificado en el Integrador.txt y la documentación del proyecto. El SDK `mercadopago` ya está en requirements.txt, y el patrón de integración está detallado en la especificación técnica. 

La implementación debe seguir exactamente el flujo documentado:
1. Frontend renderiza CardPayment con SDK de MP (tokenización PCI-compliant)
2. Backend expone `POST /api/v1/pagos/crear` que recibe el `card_token` (no los datos de tarjeta crudos)
3. Backend genera `idempotency_key` UUID para evitar cobros duplicados
4. Backend registra el pago en tabla Pago via UoW
5. MP envía webhook IPN a `POST /api/v1/pagos/webhook`
6. Webhook valida firma, procesa `topic=payment`, y si es `approved`, llama a `transicionar_estado(accion="pagar")` con rol="Sistema"
7. Frontend hace polling (30s) o actualiza vía TanStack Query para reflejar el nuevo estado

### Risks

- **Webhook sin autenticación**: El endpoint de webhook es público (no puede tener JWT porque MP no lo envía). Hay que validar la firma del request (`X-Signature` header) para evitar falsos positivos. IP spoofing es posible — mitigar con validación de IPs de MP o firma HMAC.
- **Idempotencia**: Si el webhook se entrega múltiples veces (MP garantiza al menos una entrega), el `idempotency_key` UUID evita cobros duplicados pero hay que asegurar que la transición de estado también sea idempotente (si ya está pagado, no volver a transicionar).
- **Condición de carrera**: El webhook podría llegar ANTES de que el frontend termine de crear el pedido. El webhook debe esperar/retry si el pedido no existe aún.
- **Estados de pago prolongados**: `pending` (efectivo) o `in_process` requieren manejo — el pedido queda en pendiente hasta que MP confirme. El usuario necesita feedback visual de que el pago está en proceso.
- **Reembolsos**: La FSM actual no contempla devoluciones post-entrega. Si MP procesa un reembolso, no hay una transición definida para ese caso. Fuera de alcance del roadmap actual pero hay que documentarlo.
- **Config no actualizada**: `Settings` en `core/config.py` no incluye variables MP — hay que agregarlas o el backend no podrá conectarse.

### Ready for Proposal

**Yes** — La arquitectura existente (FSM con acción "pagar" para rol Sistema, UoW para atomicidad, patrón de módulos claro) está preparada para recibir la integración. El documento `docs/Integrador.txt` tiene toda la especificación detallada del flujo de pago, tabla Pago, y manejo de estados. Lo que falta es código puro: modelo, router, service, repository, migración, y frontend SDK.
