# Tasks: MercadoPago Payment Integration

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

~980 estimated lines (780 new + 100 modified). 3-way chained PR suggested:

| Unit | Scope | PR | Base |
|------|-------|----|------|
| 1 | Config, model, migration, repo, __init__, pedidos schema mods | PR 1 | main |
| 2 | Service (MP SDK + HMAC), router, main.py wiring, backend tests | PR 2 | main |
| 3 | pagoApi, usePago, PaymentForm, paymentStore, CartDrawer, MisPedidos, frontend tests | PR 3 | main |

## Phase 1: Foundation & Persistence

- [x] 1.1 Add `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` to `backend/app/core/config.py`
- [x] 1.2 Create `backend/app/modules/pagos/__init__.py`
- [x] 1.3 Create `backend/app/modules/pagos/model.py` — `Pago` SQLModel: pedido_id FK, mp_payment_id UNIQUE, idempotency_key UNIQUE, mp_status, status_detail, external_reference
- [x] 1.4 Create `backend/app/modules/pagos/schema.py` — `PagoCreateRequest` + `PagoResponse`
- [x] 1.5 Create `backend/app/modules/pagos/repository.py` — `create()`, `get_by_pedido()`, `get_by_mp_payment_id()`
- [x] 1.6 Create Alembic migration for `pago` table
- [x] 1.7 Add `pagos: List[Pago]` relationship to `pedidos/model.py`
- [x] 1.8 Add `payment_status: Optional[str]` to `PedidoResponse` in `pedidos/schema.py`
- [x] 1.9 Write `PagoRepository` unit tests + model constraint tests

## Phase 2: Core Backend Logic

- [x] 2.1 Create `backend/app/modules/pagos/service.py` — `crear_pago()`: generate idempotency_key, call MP SDK `sdk.payment().create()`, INSERT Pago
- [x] 2.2 Implement `procesar_webhook()`: raw body → HMAC-SHA256 X-Signature validation, dedup by mp_payment_id, 202 on missing pedido, insert Pago, call `transicionar_estado(pedido_id, "pagar", None, "Sistema")` if approved
- [x] 2.3 Create `backend/app/modules/pagos/router.py` — POST `/crear` (JWT), POST `/webhook` (public HMAC), GET `/{pedido_id}` (JWT)
- [x] 2.4 Register `pagos_router` in `backend/main.py`
- [x] 2.5 Unit tests: `crear_pago` — mock MP SDK, verify idempotency + commit
- [x] 2.6 Unit tests: `procesar_webhook` — valid/invalid HMAC, dedup, 202 race, approved/rejected, FSM call

## Phase 3: Frontend Integration

- [x] 3.1 Add `@mercadopago/sdk-react` to `frontend/package.json`
- [x] 3.2 Create `frontend/src/shared/api/pagoApi.ts` — `crearPago()`, `getPagoByPedido()`
- [x] 3.3 Create `frontend/src/shared/hooks/usePago.ts` — `useCreatePayment()` (mutation), `usePagoByPedido()` (TanStack Query, `refetchInterval: 5000`)
- [x] 3.4 Expand `frontend/src/shared/stores/paymentStore.ts` — add mpPaymentId, statusDetail, reset()
- [x] 3.5 Create `frontend/src/shared/components/PaymentForm.tsx` — `<CardPayment>` wrapper, `onPayment(token)` callback
- [x] 3.6 Update `CartDrawer.tsx` — payment step after order success: render PaymentForm, call crearPago, show polling UI
- [x] 3.7 Update `MisPedidos.tsx` — payment_status badge + status_detail in order detail modal
- [x] 3.8 Unit tests: `paymentStore` — status transitions, reset
- [x] 3.9 Unit tests: `usePagoByPedido` polling — mock API, fake timers

## Phase 4: Verification

- [ ] 4.1 Run full test suites (backend + frontend) — confirm existing tests pass
- [ ] 4.2 Manual E2E with MP sandbox card (4509 9535 6623 3704)
