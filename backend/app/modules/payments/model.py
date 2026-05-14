"""
Modelos para el módulo de Pagos (MercadoPago)
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, JSON
from enum import Enum


class EstadoPago(str, Enum):
    """Estados posibles de una transacción de pago"""
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    EN_PROCESO = "en_proceso"
    CANCELADO = "cancelado"


class PagoTransaccion(SQLModel, table=True):
    """Modelo que registra cada transacción de pago procesada"""
    __tablename__ = "pago_transacciones"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", nullable=False)

    # Datos de MercadoPago
    mercadopago_payment_id: Optional[int] = Field(default=None, nullable=True)
    mercadopago_preference_id: Optional[str] = Field(default=None, nullable=True)

    # Estado actual de esta transacción
    estado: str = Field(default=EstadoPago.PENDIENTE.value, nullable=False)

    # Tipo de evento que generó esta transacción (ej: "payment.created", "payment.updated")
    tipo_evento: Optional[str] = Field(default=None, nullable=True)

    # Payload completo de la notificación o respuesta de MP
    metadata: dict = Field(default={}, sa_type=JSON)

    # Clave única para idempotencia (mercadopago_payment_id + tipo_evento)
    idempotency_key: Optional[str] = Field(default=None, nullable=True)

    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
