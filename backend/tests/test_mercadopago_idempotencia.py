"""
Tests de idempotencia para webhooks de MercadoPago (8.4).
Verifica que el mismo webhook no se procese dos veces.
"""
from unittest.mock import patch, MagicMock
import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.modules.payments.model import PagoTransaccion, EstadoPago
from app.modules.payments.repository import PagoRepository


@pytest.fixture
def session():
    """Fixture que provee una sesión de BD en memoria para tests."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


class TestIdempotencia:
    """Tests de idempotencia en el repositorio de pagos (5.1, 8.4)"""

    def test_crear_transaccion_unica(self, session):
        """5.1: Crear transacción sin conflicto debe funcionar."""
        repo = PagoRepository(session)

        transaccion = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            tipo_evento="payment.approved",
            idempotency_key="12345_payment.approved",
            metadata={},
        )

        creada, es_nueva = repo.crear_si_no_existe(transaccion)
        assert creada is not None
        assert es_nueva is True
        assert creada.id is not None

    def test_idempotencia_misma_key_no_duplica(self, session):
        """8.4: Misma idempotency_key no debe crear duplicado."""
        repo = PagoRepository(session)

        # Primera inserción
        t1 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            tipo_evento="payment.approved",
            idempotency_key="12345_payment.approved",
            metadata={},
        )
        primera, es_nueva = repo.crear_si_no_existe(t1)
        assert es_nueva is True

        # Segunda inserción con misma key
        t2 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            tipo_evento="payment.approved",
            idempotency_key="12345_payment.approved",
            metadata={"extra": "data"},
        )
        segunda, es_nueva = repo.crear_si_no_existe(t2)
        assert es_nueva is False  # No se creó duplicado
        assert segunda.id == primera.id  # Retorna la original

    def test_distintos_eventos_mismo_payment_se_procesan(self, session):
        """8.4: Diferentes eventos del mismo payment sí se procesan."""
        repo = PagoRepository(session)

        # Evento: payment.pending
        t1 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.PENDIENTE.value,
            tipo_evento="payment.pending",
            idempotency_key="12345_payment.pending",
            metadata={},
        )
        repo.crear_si_no_existe(t1)

        # Evento: payment.approved (mismo payment, distinto evento)
        t2 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            tipo_evento="payment.approved",
            idempotency_key="12345_payment.approved",
            metadata={},
        )
        segunda, es_nueva = repo.crear_si_no_existe(t2)
        assert es_nueva is True  # Se creó porque es otro evento

        # Verificar que hay 2 transacciones para ese payment
        transacciones = repo.get_by_payment_id(12345)
        assert len(transacciones) == 2

    def test_sin_idempotency_key_siempre_crea(self, session):
        """Transacciones sin key de idempotencia siempre se crean."""
        repo = PagoRepository(session)

        t1 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            metadata={},
        )
        repo.crear_si_no_existe(t1)

        t2 = PagoTransaccion(
            pedido_id=1,
            mercadopago_payment_id=12345,
            estado=EstadoPago.APROBADO.value,
            metadata={},
        )
        segunda, es_nueva = repo.crear_si_no_existe(t2)
        assert es_nueva is True
        assert segunda.id != t1.id
