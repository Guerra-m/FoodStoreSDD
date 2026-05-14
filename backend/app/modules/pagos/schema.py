"""
Schemas para el módulo de Pagos (MercadoPago)
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PagoCreateRequest(BaseModel):
    """Schema para crear un pago vía MercadoPago"""
    pedido_id: int
    card_token: str


class PagoResponse(BaseModel):
    """Schema de respuesta para un pago — no expone idempotency_key"""
    id: int
    pedido_id: int
    mp_payment_id: Optional[int] = None
    mp_status: str
    status_detail: Optional[str] = None
    external_reference: str
    created_at: datetime

    class Config:
        from_attributes = True
