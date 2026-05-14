"""
Repository para el módulo de Pagos
"""
from typing import Optional, List
from datetime import datetime

from sqlmodel import Session, select


from app.modules.payments.model import PagoTransaccion


class PagoRepository:
    """Repositorio para operaciones de PagoTransaccion."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, transaccion: PagoTransaccion) -> PagoTransaccion:
        """Crea una nueva transacción de pago."""
        self.session.add(transaccion)
        self.session.commit()
        self.session.refresh(transaccion)
        return transaccion

    def get_by_id(self, transaccion_id: int) -> Optional[PagoTransaccion]:
        """Obtiene una transacción por ID."""
        return self.session.get(PagoTransaccion, transaccion_id)

    def get_by_pedido(self, pedido_id: int) -> List[PagoTransaccion]:
        """Obtiene todas las transacciones de un pedido."""
        statement = (
            select(PagoTransaccion)
            .where(PagoTransaccion.pedido_id == pedido_id)
            .order_by(PagoTransaccion.creado_en.desc())
        )
        return list(self.session.exec(statement).all())

    def get_ultima_by_pedido(self, pedido_id: int) -> Optional[PagoTransaccion]:
        """Obtiene la última transacción de un pedido."""
        statement = (
            select(PagoTransaccion)
            .where(PagoTransaccion.pedido_id == pedido_id)
            .order_by(PagoTransaccion.creado_en.desc())
            .limit(1)
        )
        return self.session.exec(statement).first()

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[PagoTransaccion]:
        """Busca una transacción por su clave de idempotencia."""
        statement = select(PagoTransaccion).where(
            PagoTransaccion.idempotency_key == idempotency_key
        )
        return self.session.exec(statement).first()

    def get_by_payment_id(self, mercadopago_payment_id: int) -> List[PagoTransaccion]:
        """Obtiene todas las transacciones para un payment_id de MP."""
        statement = (
            select(PagoTransaccion)
            .where(PagoTransaccion.mercadopago_payment_id == mercadopago_payment_id)
            .order_by(PagoTransaccion.creado_en.desc())
        )
        return list(self.session.exec(statement).all())

    def crear_si_no_existe(self, transaccion: PagoTransaccion) -> tuple[PagoTransaccion, bool]:
        """
        Crea una transacción si no existe otra con la misma idempotency_key.
        Retorna (transaccion, creada) donde creada es True si se insertó.
        """
        if transaccion.idempotency_key:
            existente = self.get_by_idempotency_key(transaccion.idempotency_key)
            if existente:
                return existente, False

        return self.create(transaccion), True
