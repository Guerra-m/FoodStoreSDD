"""
Repository para el módulo de Pagos (MercadoPago)
"""
from typing import Optional, List

from sqlmodel import Session, select

from app.modules.pagos.model import Pago


class PagoRepository:
    """Repositorio para operaciones de Pago."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, pago: Pago) -> Pago:
        """Crea un nuevo registro de pago."""
        self.session.add(pago)
        self.session.commit()
        self.session.refresh(pago)
        return pago

    def get_by_pedido(self, pedido_id: int) -> List[Pago]:
        """Obtiene todos los pagos asociados a un pedido."""
        statement = select(Pago).where(Pago.pedido_id == pedido_id)
        return list(self.session.exec(statement).all())

    def get_by_mp_payment_id(self, mp_payment_id: int) -> Optional[Pago]:
        """Obtiene un pago por su ID de MercadoPago (para webhook dedup)."""
        statement = select(Pago).where(Pago.mp_payment_id == mp_payment_id)
        return self.session.exec(statement).first()
