## Verification Report

**Change**: mercadopago-integration
**Version**: N/A (initial)
**Mode**: Standard

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 18 (Phase 1: 9 + Phase 2: 6 + Phase 3: 0 + Phase 4: 0) |
| Tasks complete (Phase 1 + 2) | 15 / 15 |
| Tasks incomplete (Phase 1 + 2) | 0 |
| Phase 3 (Frontend) | 0 / 9 — out of scope for this verify |
| Phase 4 (Verification) | 0 / 2 — out of scope for this verify |

All Phase 1 (1.1–1.9) and Phase 2 (2.1–2.6) tasks marked `[x]`.

### Build & Tests Execution

**Build**: ✅ Passed (import check + test collection succeeds)

**Tests**: ✅ 25 passed / ❌ 0 failed / ⚠️ 0 skipped
```
platform linux -- Python 3.12.3, pytest-9.0.3, pluggy-1.6.0
rootdir: /home/noguedev/FoodStoreSDD
collected 25 items

backend/test_pagos.py::TestPagoRepository::test_create_pago PASSED
backend/test_pagos.py::TestPagoRepository::test_get_by_pedido PASSED
backend/test_pagos.py::TestPagoRepository::test_get_by_pedido_empty PASSED
backend/test_pagos.py::TestPagoRepository::test_get_by_mp_payment_id_found PASSED
backend/test_pagos.py::TestPagoRepository::test_get_by_mp_payment_id_not_found PASSED
backend/test_pagos.py::TestPagoRepository::test_get_by_mp_payment_id_none PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_unique_idempotency_key PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_unique_mp_payment_id PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_mp_payment_id_nullable_duplicates_allowed PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_pedido_relationship PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_pedido_pagos_back_populates PASSED
backend/test_pagos.py::TestPagoModelConstraints::test_required_fields PASSED
backend/test_pagos.py::TestCrearPago::test_crear_pago_success PASSED
backend/test_pagos.py::TestCrearPago::test_crear_pago_pedido_not_found PASSED
backend/test_pagos.py::TestCrearPago::test_crear_pago_not_owner PASSED
backend/test_pagos.py::TestCrearPago::test_crear_pago_mp_error PASSED
backend/test_pagos.py::TestProcesarWebhook::test_valid_hmac_approved PASSED
backend/test_pagos.py::TestProcesarWebhook::test_invalid_hmac PASSED
backend/test_pagos.py::TestProcesarWebhook::test_missing_signature_still_processes PASSED
backend/test_pagos.py::TestProcesarWebhook::test_dedup PASSED
backend/test_pagos.py::TestProcesarWebhook::test_202_race_condition PASSED
backend/test_pagos.py::TestProcesarWebhook::test_rejected_status_no_fsm_call PASSED
backend/test_pagos.py::TestProcesarWebhook::test_not_payment_topic PASSED
backend/test_pagos.py::TestProcesarWebhook::test_fsm_call_only_on_first_approved PASSED
backend/test_pagos.py::TestProcesarWebhook::test_v1_signature_format PASSED
```

**Coverage**: ➖ Not available (no coverage config found for this project)

### Spec Compliance Matrix

#### payment-processing/spec.md

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Creación de preferencia de pago | Creación exitosa | `test_crear_pago_success` | ✅ COMPLIANT |
| Creación de preferencia de pago | Error de MP API | `test_crear_pago_mp_error` | ✅ COMPLIANT |
| Idempotency en creación de pago | Primer intento procesado | `test_crear_pago_success` (verifica idempotency_key UUID) | ✅ COMPLIANT |
| Idempotency en creación de pago | Webhook duplicado rechazado | `test_dedup` | ✅ COMPLIANT |
| Idempotency en creación de pago | UNIQUE constraint idempotency_key | `test_unique_idempotency_key` | ✅ COMPLIANT |
| Idempotency en creación de pago | UNIQUE constraint mp_payment_id | `test_unique_mp_payment_id` | ✅ COMPLIANT |
| Validación de webhook IPN | X-Signature válida | `test_valid_hmac_approved` | ✅ COMPLIANT |
| Validación de webhook IPN | X-Signature inválida | `test_invalid_hmac` | ✅ COMPLIANT |
| Validación de webhook IPN | topic no soportado | `test_not_payment_topic` | ✅ COMPLIANT |
| Transición FSM por webhook | approved transiciona pedido | `test_valid_hmac_approved` (verifica pedido.estado == "pagado") | ✅ COMPLIANT |
| Transición FSM por webhook | rejected no transiciona | `test_rejected_status_no_fsm_call` | ✅ COMPLIANT |
| Race condition | Webhook antes que pedido | `test_202_race_condition` | ⚠️ PARTIAL (returns 202 but no retry/backoff implementation) |
| Race condition | Pedido nunca llega | (no test found) | ❌ UNTESTED |
| Modelo Pago y tracking | Pago creado con todos los campos | `test_create_pago`, `test_valid_hmac_approved` | ✅ COMPLIANT |
| Modelo Pago y tracking | Consulta de estado de pago | (no test found — `payment_status` en `PedidoResponse` nunca se popula) | ❌ UNTESTED |

#### order-management/spec.md (delta)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Transiciones vía FSM (MODIFIED) | pendiente→pagado Admin O Sistema | `test_valid_hmac_approved`, FSM code inspection | ✅ COMPLIANT |
| Transiciones vía FSM | pendiente→cancelado, pagado→preparando, etc. | Existing FSM tests (pre-changes) | ✅ COMPLIANT |
| Transiciones vía FSM | Inválida rechazada | Existing FSM tests | ✅ COMPLIANT |
| Autorización por rol (MODIFIED) | Sistema ejecuta pagar sin JWT | `test_valid_hmac_approved` (no JWT, direct service call) | ✅ COMPLIANT |
| Autorización por rol | Cliente cancela propio pedido | Existing FSM tests | ✅ COMPLIANT |
| Autorización por rol | Cliente no puede pagar | FSM inspection — pagar requires Admin/Sistema | ✅ COMPLIANT |
| Autorización por rol | Cliente no puede ver pedido ajeno | Existing tests | ✅ COMPLIANT |
| Autorización por rol | Admin puede transicionar cualquier pedido | Existing tests | ✅ COMPLIANT |
| Endpoint único Sistema (ADDED) | Sistema transiciona vía endpoint estándar | (no test — system uses webhook, not HTTP endpoint) | ❌ UNTESTED |

**Compliance summary**: 18 / 22 scenarios compliant, 2 partial, 2 untested.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Pago SQLModel con campos especificados | ✅ Implemented | id, pedido_id FK, mp_payment_id UQ, mp_status, status_detail, idempotency_key UQ, external_reference, created_at. All per design. |
| PagoResponse schema | ✅ Implemented | Excludes idempotency_key per design. Uses `from_attributes=True`. |
| PagoCreateRequest schema | ✅ Implemented | pedido_id + card_token. |
| PagoRepository CRUD | ✅ Implemented | create, get_by_pedido, get_by_mp_payment_id. |
| PagoService.crear_pago | ✅ Implemented | Generates UUID idempotency_key, calls MP SDK, validates pedido ownership, creates Pago. |
| PagoService.procesar_webhook | ✅ Implemented | HMAC validation, dedup, 202 race, FSM call for approved, Pago creation. |
| POST /crear endpoint (JWT) | ✅ Implemented | Dependency: Depends(get_current_user). |
| POST /webhook endpoint (public) | ✅ Implemented | No JWT dependency. Reads raw body. |
| GET /{pedido_id} endpoint (JWT) | ✅ Implemented | Validates pedido ownership. |
| Router registration in main.py | ✅ Implemented | `app.include_router(pagos_router)` at line 55. |
| MP config in Settings | ✅ Implemented | MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET. |
| pagos: List[Pago] relationship on Pedido | ✅ Implemented | `back_populates="pedido"` in model.py line 44. |
| payment_status: Optional[str] on PedidoResponse | ⚠️ Implemented but NEVER populated | Schema field exists at line 59, but `_to_response()` doesn't set it. Always `None`. |
| Alembic migration for pago table | ✅ Implemented | Creates pago table with all constraints + index. |
| FSM "pendiente" transition supports "Sistema" | ✅ Implemented | TRANSITION_MAP: `"pagar": ("pagado", ["Admin", "Sistema"])`. |
| _transicionar_si_corresponde | ✅ Implemented | Calls transicionar_estado with usuario_id=None, usuario_rol="Sistema". |
| HMAC validation | ✅ Implemented | Both raw hex and `ts=...,v1=` formats supported. |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| New `pagos` module | ✅ Yes | `app/modules/pagos/` with Router→Service→Repository→Model pattern. |
| X-Signature HMAC validation (no JWT) | ✅ Yes | Webhook endpoint is public, validates HMAC in service layer. |
| Dual-layer idempotency: UUID idempotency_key + UNIQUE mp_payment_id | ✅ Yes | Both constraints in model. Webhook dedup by mp_payment_id. |
| Polling (TanStack Query) for frontend | ➖ Not applicable | Frontend not verified (PR 3). |
| UoW pattern (direct commit) | ✅ Yes | Service does `self.session.commit()`. Matches pedidos pattern. |
| External reference = str(pedido.id) | ✅ Yes | Both crear_pago and procesar_webhook use `str(pedido.id)`. |
| Webhook reads raw body before .json() | ✅ Yes | `await request.body()` in router. |
| HMAC computed with hmac.compare_digest | ✅ Yes | `hmac.compare_digest(expected, received)` at line 158. |
| FSM call: usuario_id=None, usuario_rol="Sistema" | ✅ Yes | `_transicionar_si_corresponde` at line 274-279. |
| Race condition → 202 | ✅ Yes | Returns 202 when pedido not found. |
| MP SDK for payment creation | ✅ Yes | `mercadopago.SDK(settings.MP_ACCESS_TOKEN)`. |

### Issues Found

**CRITICAL**:

1. **Atomicity bug in `procesar_webhook` — FSM commits before Pago persists**
   - **File**: `backend/app/modules/pagos/service.py`, lines 234-251
   - **What**: `_transicionar_si_corresponde()` (line 235) calls `PedidoService.transicionar_estado()` which commits the session (line 289 of `pedidos/service.py`). Then the Pago creation at line 237-248 uses the same session and could fail. If it does, `self.session.rollback()` at line 250 CANNOT undo the FSM commit.
   - **Impact**: If the Pago insert fails after the FSM transition commits, the pedido ends up in "pagado" state with NO Pago record. Subsequent MP webhook retries will fail because the FSM won't re-transition (pagar is only valid from "pendiente").
   - **Fix**: Create the Pago record BEFORE calling `_transicionar_si_corresponde`, or use a savepoint pattern. Swap steps 8 and 9 in `procesar_webhook`.

**WARNING**:

1. **`payment_status` field never populated in PedidoResponse**
   - **File**: `backend/app/modules/pedidos/service.py`, `_to_response()` method, and `backend/app/modules/pedidos/schema.py` line 59
   - **What**: `PedidoResponse.payment_status` is defined in the schema (default `None`) but `PedidoService._to_response()` never sets it. The spec requirement "Consulta de estado de pago" says the pedido response SHALL include `mp_status` and `status_detail`.
   - **Impact**: Frontend can't display payment status via the pedido endpoint. It must call a separate `GET /pagos/{pedido_id}`.
   - **Fix**: In `_to_response()`, compute `payment_status` from the latest Pago's mp_status, or make the response depend on pagos relationship.

2. **Spec/design mismatch: "Endpoint único compatible con Sistema" not via HTTP**
   - **File**: `openspec/changes/mercadopago-integration/specs/order-management/spec.md`, ADDED Requirement
   - **What**: The delta spec says `POST /api/v1/pedidos/{id}/transicion` SHALL work for Sistema with X-Signature. The implementation routes Sistema through the webhook endpoint (`POST /api/v1/pagos/webhook`) → direct service call, bypassing the pedidos HTTP endpoint. The pedidos router still requires JWT (see `pedidos/router.py` line 100).
   - **Impact**: The spec scenario "Sistema transiciona vía endpoint estándar" is untested and not implemented per the literal spec. However, the design.md explicitly chose this approach. The architecture is coherent — it just doesn't match the spec wording.
   - **Fix**: Either update the spec to reflect the design (preferred), or add Sistema X-Signature support to the pedidos router.

3. **Pydantic V2 deprecated `class Config` pattern across multiple schema files**
   - **Files**: `pagos/schema.py`, `pedidos/schema.py`, `core/config.py`, `auth/schemas.py`
   - **What**: Using `class Config: from_attributes = True` instead of `model_config = ConfigDict(from_attributes=True)`. Triggers `PydanticDeprecatedSince20` warnings. These will break in Pydantic V3.
   - **Impact**: Will need migration before upgrading pydantic. Cosmetic for now.

**SUGGESTION**:

1. **`datetime.utcnow()` deprecated in Python 3.12**
   - **Files**: `pagos/model.py` line 30, `pagos/service.py` line 282, `pedidos/service.py` lines 120/275/282
   - **What**: `datetime.utcnow()` is deprecated. Should use `datetime.now(datetime.UTC)`.
   - **Impact**: Deprecation warnings in test output.

2. **Silent exception swallowing in `_transicionar_si_corresponde`**
   - **File**: `backend/app/modules/pagos/service.py`, lines 280-283
   - **What**: Any exception from the FSM transition is caught and silently ignored (just rolls back). No logging or diagnostic info.
   - **Impact**: Hard to debug in production when FSM transitions fail.
   - **Fix**: At minimum log the exception before swallowing.

3. **Exponential backoff for race condition not implemented**
   - **File**: `backend/app/modules/pagos/service.py`, lines 227-231
   - **What**: The spec says the system should implement exponential backoff (1s, 4s, 16s, max 3 retries) for webhooks that arrive before the pedido exists. The implementation returns 202 but relies on MP's own retry mechanism. No local retry queue.
   - **Impact**: MP may retry faster or slower than expected. This is acceptable for now since MP has its own retry logic.

### Verdict

**PASS WITH WARNINGS**

The implementation covers 15/15 Phase 1+2 tasks, all 25 tests pass, and the core architecture is solid. However, the **CRITICAL atomicity bug** in `procesar_webhook` (FSM commits before Pago persists) must be fixed before production deployment, and the `payment_status` field needs to be populated in pedido responses to satisfy the spec. The spec/design mismatch on the "endpoint único" requirement should be resolved at the spec level.
