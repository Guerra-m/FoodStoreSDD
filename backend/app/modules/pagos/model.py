"""
Modelo para el módulo de Pagos (MercadoPago)
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Pago(SQLModel, table=True):
    """Modelo principal del pago - representa una transacción con MercadoPago"""
    __tablename__ = "pago"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", nullable=False)

    # ID de pago devuelto por MP (se asigna post-respuesta)
    mp_payment_id: Optional[int] = Field(default=None, unique=True, nullable=True)

    # Estado del pago según MP
    mp_status: str = Field(default="pending", nullable=False)
    status_detail: Optional[str] = Field(default=None, nullable=True)

    # Clave de idempotencia para evitar duplicados en MP API
    idempotency_key: str = Field(nullable=False, unique=True)

    # Referencia externa: str(pedido.id) para correlación en MP
    external_reference: str = Field(nullable=False)

    # Timestamp de creación
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relaciones
    pedido: "Pedido" = Relationship(back_populates="pagos")
