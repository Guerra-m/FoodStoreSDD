"""
Router para el módulo de Pagos (MercadoPago)
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, Request, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.payments.schema import (
    PreferenciaPagoResponse,
    PagoEstadoResponse,
)
from app.modules.payments.service import MercadoPagoService
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["payments"])


def get_mp_service(session: Session = Depends(get_session)) -> MercadoPagoService:
    """Dependency para obtener el servicio de MercadoPago."""
    return MercadoPagoService(session)


@router.post(
    "/api/v1/pedidos/{pedido_id}/preferencia-pago",
    response_model=PreferenciaPagoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_preferencia_pago(
    pedido_id: int,
    current_user: UserResponse = Depends(get_current_user),
    mp_service: MercadoPagoService = Depends(get_mp_service),
):
    """
    Crea una preferencia de pago en MercadoPago para un pedido.

    Requiere autenticación. Solo el propietario del pedido puede crear la preferencia.
    El pedido debe estar en estado "pendiente".
    """
    from fastapi import HTTPException

    resultado, error = mp_service.crear_preferencia(
        pedido_id=pedido_id,
        cliente_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return resultado


@router.get(
    "/api/v1/pedidos/{pedido_id}/pago/status",
    response_model=PagoEstadoResponse,
)
async def consultar_estado_pago(
    pedido_id: int,
    current_user: UserResponse = Depends(get_current_user),
    mp_service: MercadoPagoService = Depends(get_mp_service),
):
    """
    Consulta el estado de pago de un pedido.

    Requiere autenticación. Solo el propietario del pedido puede consultar.
    """
    from fastapi import HTTPException

    resultado, error = mp_service.consultar_estado_pago(
        pedido_id=pedido_id,
        cliente_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=404, detail=error)

    return resultado


@router.post("/api/v1/webhooks/mercadopago")
async def webhook_mercadopago(
    request: Request,
    mp_service: MercadoPagoService = Depends(get_mp_service),
):
    """
    Endpoint para recibir notificaciones IPN de MercadoPago.

    No requiere autenticación. La validación se hace mediante
    la firma HMAC en el header 'x-signature'.

    Siempre retorna 200 para evitar reintentos de MercadoPago,
    incluso si hay errores de procesamiento internos.
    """
    try:
        body = await request.json()
        headers = dict(request.headers)
        mp_service.procesar_webhook(body, headers)
    except Exception as e:
        logger.error(f"Error al procesar webhook de MercadoPago: {e}")

    return {"status": "ok"}
