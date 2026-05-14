# Design: MercadoPago Payment Integration

## Technical Approach

New `pagos` module following the existing Router → Service → Repository → Model pattern from `pedidos`. Backend creates MP Checkout API payments via `mercadopago==2.3.0` SDK; frontend renders `<CardPayment />` via `@mercadopago/sdk-react` for PCI-compliant card tokenization. Webhook/IPN endpoint validates `X-Signature` HMAC, deduplicates via `mp_payment_id` UNIQUE constraint, and calls `transicionar_estado(accion="pagar", rol="Sistema")` on the pedidos FSM.

## Architecture Decisions

### Decision: New `pagos` module vs extending `pedidos`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New module `app/modules/pagos/` | More files, clearer separation | ✅ **Chosen** — matches 6 existing modules pattern |
| Embed in `pedidos` module | Less files, tighter coupling | Pago has distinct lifecycle, webhook, MP SDK dependency |

### Decision: Webhook auth without JWT

| Option | Tradeoff | Decision |
|--------|----------|----------|
| X-Signature HMAC validation | Raw body reading required | ✅ **Chosen** — MP standard, no shared secret over wire |
| IP whitelisting | MP IP ranges change | Rejected — fragile, undocumented |
| Static bearer token | Must share via side channel | Rejected — less secure than HMAC |

### Decision: Idempotency strategy — dual layer

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| MP API calls | UUID `idempotency_key` sent with SDK | Prevents duplicate charges by MP |
| Webhook delivery | UNIQUE constraint on `mp_payment_id` | Prevents duplicate FSM transitions |

Both layers needed — they solve different problems.

### Decision: Polling vs WebSocket for frontend

**Choice**: TanStack Query `refetchInterval: 5000ms` for first 60s after payment creation.  
**Rationale**: Existing frontend uses TanStack Query exclusively. Payment confirmation is typically <10s. WebSocket infrastructure is out of scope.

### Decision: UoW pattern

**Choice**: Follow existing codebase — `Service` does `self.session.commit()` directly.  
**Rationale**: Current `pedidos/service.py` does NOT use a formal UoW (line 139 `self.session.commit()`). Introducing one now would create inconsistency. Deferred to future refactoring.

## Data Flow

```
CartDrawer → POST /api/v1/pedidos → pedido created (pendiente)
         ↓
  Render <CardPayment /> (MP SDK tokenizes card)
         ↓
  POST /api/v1/pagos/crear { card_token, pedido_id }
         ↓
  PagoService: generate idempotency_key → MP SDK → INSERT Pago
         ↓
  MP sends POST /api/v1/pagos/webhook  (X-Signature)
         ↓
  Validate HMAC → find Pago by mp_payment_id:
    if approved: transicionar_estado(pedido_id, "pagar", usuario_id=None, rol="Sistema")
         ↓
  Frontend polling GET /api/v1/pedidos/{id} → estado="pagado" → updates UI
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/app/modules/pagos/__init__.py` | Create | Package init |
| `backend/app/modules/pagos/model.py` | Create | Pago SQLModel: id, pedido_id FK, mp_payment_id UQ, mp_status, status_detail, idempotency_key UQ, external_reference, created_at |
| `backend/app/modules/pagos/schema.py` | Create | PagoResponse (excluye idempotency_key), PagoCreateRequest |
| `backend/app/modules/pagos/repository.py` | Create | PagoRepository: create, get_by_pedido, get_by_mp_id |
| `backend/app/modules/pagos/service.py` | Create | PagoService: crear_pago (MP SDK), procesar_webhook (HMAC + FSM) |
| `backend/app/modules/pagos/router.py` | Create | POST /crear (JWT Cliente), POST /webhook (public HMAC), GET /{pedido_id} (JWT) |
| `backend/app/core/config.py` | Modify | Add MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET |
| `backend/main.py` | Modify | Register `pagos_router` |
| `backend/app/modules/pedidos/model.py` | Modify | Add `pagos: List["Pago"] = Relationship(back_populates="pedido")` |
| `backend/app/modules/pedidos/schema.py` | Modify | Add `payment_status: Optional[str]` to PedidoResponse |
| `backend/alembic/versions/` | Create | Migration for Pago table |
| `frontend/src/shared/api/pagoApi.ts` | Create | crearPago(), getPagoByPedido() |
| `frontend/src/shared/hooks/usePago.ts` | Create | useCreatePayment, usePagoByPedido (polling) |
| `frontend/src/shared/stores/paymentStore.ts` | Modify | Add mpPaymentId, statusDetail, reset() |
| `frontend/src/features/shopping-cart/components/CartDrawer.tsx` | Modify | Add payment step after order success |
| `frontend/src/app/pages/MisPedidos.tsx` | Modify | Show payment status in order detail modal |
| `frontend/package.json` | Modify | Add `@mercadopago/sdk-react` |

## Interfaces

### Pago Model

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto |
| pedido_id | int | FK → pedido.id, NOT NULL |
| mp_payment_id | int | NULL, UNIQUE (set post-MP response) |
| mp_status | str | NOT NULL, default "pending" |
| status_detail | str | NULL |
| idempotency_key | str | NOT NULL, UNIQUE |
| external_reference | str | NOT NULL (pedido.id as string) |
| created_at | datetime | default utcnow |

### API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/pagos/crear` | JWT (Cliente) | Create payment with card token |
| POST | `/api/v1/pagos/webhook` | Public (HMAC) | MP IPN notification |
| GET | `/api/v1/pagos/{pedido_id}` | JWT (propietario/Admin) | Query payment status |

### Webhook Security

- Read raw body: `await request.body()` before .json()
- Compute HMAC-SHA256 with `MP_WEBHOOK_SECRET` as key
- Compare with `X-Signature` header via `hmac.compare_digest`
- Return 401 on mismatch, 202 if Pago not yet created (race condition retry), 200 on processed

### FSM Call

```python
# Webhook → PagoService.procesar_webhook → direct call to PedidoService
resultado, error, status_code = pedido_service.transicionar_estado(
    pedido_id=pedido_id,
    accion="pagar",
    usuario_id=None,         # Sistema, no user
    usuario_rol="Sistema",   # Authorized by FSM: ("pagado", ["Admin", "Sistema"])
)
```

## Race Condition: Webhook Before DB Write

Scenario: MP sends webhook before frontend's POST /crear inserts the Pago row.  
Mitigation: Webhook returns 202 (not ready, retry). MP retries with backoff. Frontend polling fills gap — if pedido is already `pagado` when webhook arrives, FSM rejects idempotently (cannot transition from `pagado` again → returns error, no harm).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | PagoRepository CRUD | Mock session, test create + get_by_mp_id + get_by_pedido |
| Unit | PagoService.crear_pago | Mock MP SDK, verify idempotency_key + UoW commit |
| Unit | PagoService.procesar_webhook | Mock FSM, test HMAC valid/invalid, test 202 race condition |
| Integration | POST /crear + webhook flow | Test DB, real MP sandbox (requires credentials) |
| Frontend | paymentStore | Zustand test: status transitions, reset |
| Frontend | usePagoByPedido polling | Mock Api with fake timers (Vitest) |
| E2E | CardPayment flow | Manual with MP sandbox test cards (4509 9535 6623 3704) |

## Migration

New Alembic migration creating `pago` table. `alembic upgrade head` required.

## Open Questions

- [ ] MP_WEBHOOK_SECRET: confirm source — is it the client_secret from MP app credentials, or a separate webhook secret configurable in the MP dashboard?
- [ ] external_reference: confirmed to use `str(pedido.id)` or generate a separate UUID? Integrador.txt says "UUID del Pedido" — we'll use `str(pedido.id)` for simplicity unless UUID is needed for security.
