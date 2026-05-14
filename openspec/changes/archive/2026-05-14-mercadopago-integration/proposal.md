# Proposal: MercadoPago Payment Integration

## Intent

Close the commercial loop: user pays via MP CardPayment, webhook confirms, system auto-transitions `pendiente→pagado`. Today only Admin triggers that manually.

## Scope

### In Scope
- New `pagos` module (model, service, repo, router, schema) + `Pago` migration
- MP config in `Settings`, router registration
- Payment flow: CardPayment → webhook → `transicionar_estado` as Sistema
- X-Signature HMAC validation (no JWT), idempotency via unique `idempotency_key`
- Frontend: payment step in CartDrawer, `paymentStore` expansion, MP status in MisPedidos
- Install `@mercadopago/sdk-react`

### Out of Scope
- Refunds (not in FSM)
- Prolonged-payment UX (`in_process`, `pending` — deferred to change #12)
- Alternative gateways (MP only)

## Capabilities

### New Capabilities
- `payment-processing`: MP Checkout API, embedded CardPayment, webhook/IPN with idempotency, Pago model

### Modified Capabilities
- `order-management`: FSM `pagar` triggered by Sistema via webhook; Pedido gains Pago relationship

## Approach

Full Checkout API with embedded CardPayment (exploration Approach 1). Backend creates MP preference → CardPayment rendered → webhook validates X-Signature, deduplicates, creates Pago, calls `transicionar_estado` as Sistema → FSM `pendiente→pagado`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/app/modules/pagos/` | **New** | Model, service, repo, router, schemas |
| `backend/app/modules/pedidos/model.py` | Modified | Pago relationship on Pedido |
| `backend/app/modules/pedidos/fsm.py` | Audit | Verify Sistema role works without JWT |
| `backend/app/modules/pedidos/service.py` | Modified | `transicionar_estado` Sistema flag |
| `backend/app/core/config.py` | Modified | Add `MERCADOPAGO_ACCESS_TOKEN` |
| `backend/main.py` | Modified | Register pagos router |
| `backend/alembic/versions/` | **New** | Pago table migration |
| `frontend/.../CartDrawer.tsx` | Modified | Payment step after order |
| `frontend/.../paymentStore.ts` | Modified | Full payment state |
| `frontend/.../MisPedidos.tsx` | Modified | Payment status per order |
| `frontend/package.json` | Modified | Add `@mercadopago/sdk-react` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Webhook has no JWT | High | Validate X-Signature HMAC |
| Duplicate delivery | Medium | `idempotency_key` unique constraint |
| Webhook before order exists | Low | Return 202 + retry with backoff |
| Payment stays `in_process` | Medium | Frontend polling + Admin manual fallback |

## Rollback Plan

1. **DB**: `alembic downgrade` → drop Pago table
2. **Config**: Remove MP token from Settings
3. **Backend**: Drop pagos router & module, revert FSM
4. **Frontend**: Revert CartDrawer/paymentStore/MisPedidos, remove MP SDK from package.json

## Dependencies

- `mercadopago==2.3.0` in requirements.txt (verify)
- `@mercadopago/sdk-react` to install
- MP `MERCADOPAGO_ACCESS_TOKEN` from merchant

## Success Criteria

- [ ] CardPayment flow ends with order `pagado` (FSM webhook transition)
- [ ] Invalid X-Signature rejected 401, duplicate webhook → single Pago record
- [ ] Payment status visible in MisPedidos
- [ ] Existing FSM + order-creation tests pass
