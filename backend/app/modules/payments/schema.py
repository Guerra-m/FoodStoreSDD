"""
Schemas para el módulo de Pagos (MercadoPago)
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PreferenciaPagoResponse(BaseModel):
    """Respuesta al crear una preferencia de pago"""
    preference_id: str
    init_point: str

    class Config:
        from_attributes = True


class PagoEstadoResponse(BaseModel):
    """Estado de pago de un pedido"""
    estado_pago: Optional[str] = None
    metodo_pago: str = "mercadopago"
    preferencia_pago_url: Optional[str] = None
    mercadopago_preference_id: Optional[str] = None

    class Config:
        from_attributes = True


class PagoTransaccionResponse(BaseModel):
    """Respuesta con datos de una transacción de pago"""
    id: int
    pedido_id: int
    mercadopago_payment_id: Optional[int] = None
    mercadopago_preference_id: Optional[str] = None
    estado: str
    tipo_evento: Optional[str] = None
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class WebhookNotification(BaseModel):
    """Notificación IPN entrante de MercadoPago"""
    topic: Optional[str] = None
    action: Optional[str] = None
    data: Optional[dict] = None
    id: Optional[int] = None

    class Config:
        from_attributes = True


class PreferenciaPagoRequest(BaseModel):
    """Request para crear preferencia de pago (body opcional si todo se obtiene del pedido)"""
    pass
