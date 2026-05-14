"""
Tests unitarios para el módulo de Pagos (MercadoPago).

Valida:
- PagoRepository: create, get_by_pedido, get_by_mp_payment_id
- Model constraints: UNIQUE en idempotency_key y mp_payment_id
- Relación Pago ↔ Pedido
- PagoService.crear_pago: mock MP SDK, idempotency + commit
- PagoService.procesar_webhook: HMAC, dedup, 202 race, approved/rejected, FSM

Ejecución: python -m pytest backend/test_pagos.py -v
Requiere: pytest
"""
import hashlib
import hmac
import json
from datetime import datetime
from typing import Dict
from unittest.mock import patch

import pytest
from sqlmodel import Session, select, create_engine, func
from sqlmodel.pool import StaticPool

from app.modules.pagos.model import Pago
from app.modules.pagos.repository import PagoRepository
from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial
from app.modules.direcciones.model import Direccion
from app.modules.usuarios.model import Usuario, UsuarioRole
from app.modules.productos.model import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.categorias.model import Categoria
from app.modules.ingredientes.model import Ingrediente


# === DATABASE SETUP ===

@pytest.fixture(name="session")
def session_fixture():
    """Crea una base de datos SQLite en memoria para tests."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="repo")
def repo_fixture(session: Session):
    """Crea una instancia de PagoRepository."""
    return PagoRepository(session)


@pytest.fixture(name="pedido")
def pedido_fixture(session: Session):
    """Crea un pedido base para asociar pagos."""
    pedido = Pedido(
        cliente_id=1,
        direccion_id=1,
        direccion_snapshot={"calle": "Test"},
        total=2000,
        estado="pendiente",
    )
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    return pedido


# === TESTS ===

class TestPagoRepository:
    """Suite de tests para PagoRepository."""

    def test_create_pago(self, repo: PagoRepository, pedido: Pedido):
        """Crea un Pago y verifica que se persista correctamente."""
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="uuid-12345",
            external_reference=str(pedido.id),
        )
        result = repo.create(pago)

        assert result.id is not None
        assert result.pedido_id == pedido.id
        assert result.mp_status == "pending"
        assert result.idempotency_key == "uuid-12345"
        assert result.external_reference == str(pedido.id)
        assert result.created_at is not None
        assert result.mp_payment_id is None
        assert result.status_detail is None

    def test_get_by_pedido(self, repo: PagoRepository, session: Session, pedido: Pedido):
        """Obtiene pagos por pedido_id — retorna lista."""
        # Crear 2 pagos para el mismo pedido
        pago1 = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="uuid-111",
            external_reference=str(pedido.id),
        )
        pago2 = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="uuid-222",
            mp_payment_id=1001,
            external_reference=str(pedido.id),
        )
        session.add(pago1)
        session.add(pago2)
        session.commit()

        result = repo.get_by_pedido(pedido.id)
        assert len(result) == 2
        assert result[0].pedido_id == pedido.id

    def test_get_by_pedido_empty(self, repo: PagoRepository, session: Session):
        """Pedido sin pagos retorna lista vacía."""
        result = repo.get_by_pedido(9999)
        assert result == []

    def test_get_by_mp_payment_id_found(self, repo: PagoRepository, session: Session, pedido: Pedido):
        """Busca por mp_payment_id existente."""
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="uuid-333",
            mp_payment_id=5001,
            external_reference=str(pedido.id),
        )
        session.add(pago)
        session.commit()

        result = repo.get_by_mp_payment_id(5001)
        assert result is not None
        assert result.mp_payment_id == 5001
        assert result.idempotency_key == "uuid-333"

    def test_get_by_mp_payment_id_not_found(self, repo: PagoRepository, session: Session):
        """mp_payment_id inexistente retorna None."""
        result = repo.get_by_mp_payment_id(99999)
        assert result is None

    def test_get_by_mp_payment_id_none(self, repo: PagoRepository, session: Session, pedido: Pedido):
        """Pago sin mp_payment_id (None) no interfiere en la búsqueda."""
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="uuid-444",
            external_reference=str(pedido.id),
        )
        session.add(pago)
        session.commit()

        # Buscar por None no debería retornar el pago
        result = repo.get_by_mp_payment_id(0)
        assert result is None


class TestPagoModelConstraints:
    """Suite de tests para constraints del modelo Pago."""

    def test_unique_idempotency_key(self, session: Session, pedido: Pedido):
        """idempotency_key UNIQUE — segundo insert con misma key falla."""
        pago1 = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="same-key",
            external_reference=str(pedido.id),
        )
        session.add(pago1)
        session.commit()

        pago2 = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="same-key",
            external_reference=str(pedido.id),
            mp_payment_id=7777,
        )
        session.add(pago2)
        with pytest.raises(Exception):
            session.commit()

    def test_unique_mp_payment_id(self, session: Session, pedido: Pedido):
        """mp_payment_id UNIQUE — segundo insert con mismo ID falla."""
        pago1 = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="key-a",
            mp_payment_id=8888,
            external_reference=str(pedido.id),
        )
        session.add(pago1)
        session.commit()

        pago2 = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="key-b",
            mp_payment_id=8888,
            external_reference=str(pedido.id),
        )
        session.add(pago2)
        with pytest.raises(Exception):
            session.commit()

    def test_mp_payment_id_nullable_duplicates_allowed(self, session: Session, pedido: Pedido):
        """Múltiples pagos con mp_payment_id=NULL están permitidos."""
        pago1 = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="key-c",
            external_reference=str(pedido.id),
        )
        pago2 = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="key-d",
            external_reference=str(pedido.id),
        )
        session.add(pago1)
        session.add(pago2)
        session.commit()
        # Si llegamos aquí sin excepción, el test pasa

    def test_pedido_relationship(self, session: Session, pedido: Pedido):
        """Verifica que la relación Pago ↔ Pedido funciona bidireccionalmente."""
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            idempotency_key="key-e",
            external_reference=str(pedido.id),
        )
        session.add(pago)
        session.commit()
        session.refresh(pago)

        assert pago.pedido is not None
        assert pago.pedido.id == pedido.id
        assert pago.pedido.estado == "pendiente"

    def test_pedido_pagos_back_populates(self, session: Session, pedido: Pedido):
        """Verifica back_populates: pedido.pagos contiene los pagos."""
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="approved",
            idempotency_key="key-f",
            mp_payment_id=9999,
            external_reference=str(pedido.id),
        )
        session.add(pago)
        session.commit()
        session.refresh(pedido)

        assert len(pedido.pagos) == 1
        assert pedido.pagos[0].mp_payment_id == 9999

    def test_required_fields(self, session: Session):
        """pedido_id, idempotency_key, external_reference son obligatorios."""
        with pytest.raises(Exception):
            pago = Pago(
                mp_status="pending",
                idempotency_key="key-g",
                # pedido_id faltante
                external_reference="1",
            )
            session.add(pago)
            session.commit()


# ──────────────────────────────────────────────────────────────────────────────
#  Tests de PagoService.crear_pago
# ──────────────────────────────────────────────────────────────────────────────

class TestCrearPago:
    """Suite de tests para ``PagoService.crear_pago``."""

    @staticmethod
    def _mock_sdk_create(mock_sdk, status=201, mp_id=12345, mp_status="approved"):
        """Configura el mock del SDK para que ``create()`` retorne una respuesta."""
        instance = mock_sdk.return_value
        instance.payment.return_value.create.return_value = {
            "status": status,
            "response": {
                "id": mp_id,
                "status": mp_status,
                "status_detail": "accredited",
            },
        }
        return instance

    def test_crear_pago_success(
        self, session: Session, pedido: Pedido
    ):
        """
        Crea un pago exitosamente.

        Verifica:
        - idempotency_key generada (UUID)
        - mp_payment_id asignado desde MP SDK response
        - Pago persistido en BD
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_create(mock_sdk)

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            result, error = service.crear_pago(
                pedido_id=pedido.id,
                card_token="tok_test_12345",
                user_email="test@example.com",
                user_id=pedido.cliente_id,
            )

        assert error is None, f"Error inesperado: {error}"
        assert result is not None
        assert result.mp_payment_id == 12345
        assert result.mp_status == "approved"
        assert result.pedido_id == pedido.id
        assert result.external_reference == str(pedido.id)
        assert result.id is not None

        # Verificar que se persiste en BD
        pago_db = session.get(Pago, result.id)
        assert pago_db is not None
        assert pago_db.mp_payment_id == 12345
        assert pago_db.idempotency_key is not None
        assert len(pago_db.idempotency_key) == 36  # UUID length

    def test_crear_pago_pedido_not_found(
        self, session: Session
    ):
        """
        Pedido inexistente → retorna error, no llama al SDK.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            result, error = service.crear_pago(
                pedido_id=9999,
                card_token="tok_test_12345",
                user_email="test@example.com",
                user_id=1,
            )

            assert result is None
            assert error is not None
            mock_sdk.return_value.payment.return_value.create.assert_not_called()

    def test_crear_pago_not_owner(
        self, session: Session, pedido: Pedido
    ):
        """
        Pedido que no pertenece al usuario → retorna error.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK"):
            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            result, error = service.crear_pago(
                pedido_id=pedido.id,
                card_token="tok_test_12345",
                user_email="test@example.com",
                user_id=9999,  # otro usuario
            )

        assert result is None
        assert error is not None

    def test_crear_pago_mp_error(
        self, session: Session, pedido: Pedido
    ):
        """
        MP SDK retorna error → retorna error, no se persiste Pago.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_create(mock_sdk, status=400, mp_id=None)

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            result, error = service.crear_pago(
                pedido_id=pedido.id,
                card_token="tok_test_bad",
                user_email="test@example.com",
                user_id=pedido.cliente_id,
            )

        assert result is None
        assert error is not None

        # Verificar que NO se persiste ningún Pago
        pagos = session.exec(select(Pago)).all()
        assert len(pagos) == 0


# ──────────────────────────────────────────────────────────────────────────────
#  Tests de PagoService.procesar_webhook
# ──────────────────────────────────────────────────────────────────────────────

class TestProcesarWebhook:
    """Suite de tests para ``PagoService.procesar_webhook``."""

    WEBHOOK_SECRET = "test_webhook_secret"

    @pytest.fixture(autouse=True)
    def _override_settings(self):
        """Override MP_WEBHOOK_SECRET para que coincida con el de los tests."""
        from app.core.config import settings as app_settings

        original = app_settings.MP_WEBHOOK_SECRET
        app_settings.MP_WEBHOOK_SECRET = self.WEBHOOK_SECRET
        yield
        app_settings.MP_WEBHOOK_SECRET = original

    @staticmethod
    def _build_webhook_body(mp_payment_id: int = 5001, topic: str = "payment") -> bytes:
        """Construye el payload JSON que envía MP."""
        payload = {
            "action": "payment.created",
            "api_version": "v1",
            "data": {"id": str(mp_payment_id)},
            "date_created": "2025-01-15T12:00:00Z",
            "id": 987654321,
            "live_mode": False,
            "type": topic,
            "user_id": "123456789",
        }
        return json.dumps(payload).encode("utf-8")

    @staticmethod
    def _build_headers(body: bytes, secret: str = WEBHOOK_SECRET) -> Dict[str, str]:
        """Construye headers incluyendo X-Signature HMAC."""
        import hashlib
        import hmac

        h = hmac.new(secret.encode("utf-8"), body, hashlib.sha256)
        return {"X-Signature": h.hexdigest(), "Content-Type": "application/json"}

    @staticmethod
    def _mock_sdk_get(mock_sdk, mp_payment_id=5001, status="approved", ext_ref="1"):
        """Configura el mock del SDK para que ``get()`` retorne payment details."""
        instance = mock_sdk.return_value
        instance.payment.return_value.get.return_value = {
            "status": 200,
            "response": {
                "id": mp_payment_id,
                "status": status,
                "status_detail": "accredited" if status == "approved" else "rejected",
                "external_reference": ext_ref,
            },
        }
        return instance

    # ── tests ──────────────────────────────────────────────────────────

    def test_valid_hmac_approved(
        self, session: Session, pedido: Pedido
    ):
        """
        Webhook con HMAC válido y status=approved.

        Verifica:
        - Pago creado en BD
        - Pedido transicionado a ``pagado`` vía FSM
        - mp_status = "approved"
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5001, status="approved", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5001)
            headers = self._build_headers(body)

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 200
        assert body_dict.get("mp_status") == "approved"

        # Pago persistido
        pago = service.repo.get_by_mp_payment_id(5001)
        assert pago is not None
        assert pago.mp_status == "approved"
        assert pago.pedido_id == pedido.id

        # Pedido transicionado a pagado
        session.refresh(pedido)
        assert pedido.estado == "pagado"

    def test_invalid_hmac(self, session: Session):
        """
        X-Signature inválida → 401.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK"):
            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5001)
            headers = {
                "X-Signature": "invalid_hmac_123",
                "Content-Type": "application/json",
            }

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 401
        error_msg = body_dict.get("error", "").lower()
        assert "firma" in error_msg or "invalid" in error_msg

    def test_missing_signature_still_processes(
        self, session: Session, pedido: Pedido
    ):
        """
        Sin X-Signature: no se valida HMAC pero igual procesa (dev).
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5002, status="approved", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5002)
            headers = {"Content-Type": "application/json"}

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 200
        pago = service.repo.get_by_mp_payment_id(5002)
        assert pago is not None

    def test_dedup(
        self, session: Session, pedido: Pedido
    ):
        """
        Mismo webhook dos veces → segunda llamada deduplica (200).

        Verifica que el Pago no se duplica y que el pedido no se
        transiciona dos veces (FSM idempotente).
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5003, status="approved", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5003)
            headers = self._build_headers(body)

            # Primera llamada
            status1, body1 = service.procesar_webhook(body, headers)
            assert status1 == 200

            # Segunda llamada (mismo body, mismo header)
            status2, body2 = service.procesar_webhook(body, headers)
            assert status2 == 200
            msg = body2.get("message", "")
            assert "already" in msg.lower()

        # Solo 1 Pago en BD para este mp_payment_id
        pagos = list(
            session.exec(select(Pago).where(Pago.mp_payment_id == 5003)).all()
        )
        assert len(pagos) == 1

    def test_202_race_condition(
        self, session: Session
    ):
        """
        Webhook para pedido que no existe → 202 (race condition).

        Simula el caso donde MP envía el webhook antes de que
        el frontend haya creado el pedido.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5004, status="approved", ext_ref="99999"
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5004)
            headers = self._build_headers(body)

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 202
        msg = body_dict.get("message", "").lower()
        assert "pedido" in msg or "race" in msg

    def test_rejected_status_no_fsm_call(
        self, session: Session, pedido: Pedido
    ):
        """
        Status "rejected" → NO se llama a la FSM, pedido sigue en pendiente.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5005, status="rejected", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5005)
            headers = self._build_headers(body)

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 200
        assert body_dict.get("mp_status") == "rejected"

        # Pedido NO se transicionó
        session.refresh(pedido)
        assert pedido.estado == "pendiente"

        # Pago creado con status rejected
        pago = service.repo.get_by_mp_payment_id(5005)
        assert pago is not None
        assert pago.mp_status == "rejected"

    def test_not_payment_topic(
        self, session: Session
    ):
        """
        Topic distinto de "payment" → 200 acknowledged, no se procesa.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK"):
            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=6001, topic="merchant_order")
            headers = self._build_headers(body)

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 200
        assert "ignored" in body_dict.get("message", "").lower()

    def test_fsm_call_only_on_first_approved(
        self, session: Session, pedido: Pedido
    ):
        """
        Webhook approved llama a FSM exactamente UNA vez.

        Verifica que en la segunda llamada (dedup) la FSM no se invoca
        de nuevo (aunque sea idempotente, debe haber solo 1 historial).
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5006, status="approved", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5006)
            headers = self._build_headers(body)

            # Primera llamada → FSM ejecutada
            service.procesar_webhook(body, headers)

        session.refresh(pedido)
        assert pedido.estado == "pagado"

        # Segunda llamada → dedup, SDK mock debe mantener el mismo retorno
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk2:
            self._mock_sdk_get(
                mock_sdk2, mp_payment_id=5006, status="approved", ext_ref=str(pedido.id)
            )

            service2 = PagoService(session)
            service2.procesar_webhook(body, headers)

        session.refresh(pedido)
        assert pedido.estado == "pagado"

        # Exactamente 1 entrada en el historial (pagado).
        # La fixture no crea historial al crear el pedido.
        historial_count = session.exec(
            select(func.count())
            .select_from(PedidoHistorial)
            .where(PedidoHistorial.pedido_id == pedido.id)
        ).first()
        assert historial_count == 1

    def test_v1_signature_format(
        self, session: Session, pedido: Pedido
    ):
        """
        X-Signature en formato ``ts=...,v1=<hmac>`` también funciona.
        """
        with patch("app.modules.pagos.service.mercadopago.SDK") as mock_sdk:
            self._mock_sdk_get(
                mock_sdk, mp_payment_id=5007, status="approved", ext_ref=str(pedido.id)
            )

            from app.modules.pagos.service import PagoService

            service = PagoService(session)
            body = self._build_webhook_body(mp_payment_id=5007)

            # Generar HMAC para el formato v1
            h = hmac.new(
                self.WEBHOOK_SECRET.encode("utf-8"), body, hashlib.sha256
            )
            headers = {
                "X-Signature": f"ts=1712345678,v1={h.hexdigest()}",
                "Content-Type": "application/json",
            }

            status_code, body_dict = service.procesar_webhook(body, headers)

        assert status_code == 200
        pago = service.repo.get_by_mp_payment_id(5007)
        assert pago is not None
        assert pago.mp_status == "approved"
