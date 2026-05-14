"""
Router para el módulo de Pagos (MercadoPago)

Endpoints:
- ``POST /api/v1/pagos/crear``   — JWT requerido, crea pago vía MP SDK
- ``POST /api/v1/pagos/webhook`` — Público, validación HMAC, IPN de MP
- ``GET  /api/v1/pagos/{pedido_id}`` — JWT requerido, consulta pagos del pedido
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.core.database import get_session
from app.modules.pagos.schema import PagoCreateRequest, PagoResponse, PreferenciaCreateRequest, PreferenciaResponse
from app.modules.pagos.service import PagoService
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserResponse

router = APIRouter(prefix="/api/v1/pagos", tags=["pagos"])


def get_pago_service(session: Session = Depends(get_session)) -> PagoService:
    """Dependency para obtener el servicio de pagos."""
    return PagoService(session)


@router.post(
    "/crear",
    response_model=PagoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_pago(
    pago_data: PagoCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    pago_service: PagoService = Depends(get_pago_service),
):
    """
    Crea un pago con MercadoPago usando un token de tarjeta.

    Requiere autenticación JWT. El pedido debe pertenecer al usuario autenticado.

    **Args (body):**
    - ``pedido_id``: ID del pedido a pagar.
    - ``card_token``: Token generado por ``@mercadopago/sdk-react``.

    **Returns:**
    ``PagoResponse`` con el estado del pago creado.
    """
    resultado, error = pago_service.crear_pago(
        pedido_id=pago_data.pedido_id,
        card_token=pago_data.card_token,
        user_email=current_user.email,
        user_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return resultado


@router.post(
    "/crear-preferencia",
    response_model=PreferenciaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_preferencia(
    pref_data: PreferenciaCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    pago_service: PagoService = Depends(get_pago_service),
):
    """
    Crea una preferencia de MercadoPago Checkout Pro.

    Requiere autenticación JWT. El pedido debe pertenecer al usuario autenticado.

    **Args (body):**
    - ``pedido_id``: ID del pedido.

    **Returns:**
    ``PreferenciaResponse`` con ``preference_id`` e ``init_point`` para redirigir al checkout de MP.
    """
    resultado, error = pago_service.crear_preferencia(
        pedido_id=pref_data.pedido_id,
        user_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return resultado


@router.post("/webhook")
async def webhook(
    request: Request,
    pago_service: PagoService = Depends(get_pago_service),
):
    """
    Webhook IPN de MercadoPago.

    **Público** — no requiere JWT. La autenticación se realiza mediante
    validación HMAC-SHA256 del body contra el header ``X-Signature``.

    MP envía notificaciones de cambio de estado de pago. Este endpoint:
    1. Valida la firma HMAC
    2. Consulta el estado actual en la API de MP
    3. Deduplica por ``mp_payment_id``
    4. Si ``status == "approved"`` transiciona la FSM del pedido
    5. Persiste o actualiza el registro ``Pago``

    **Returns:**
    ``200`` — procesado / ignorado / duplicado
    ``202`` — pedido aún no creado (race condition, MP reintentará)
    ``401`` — firma inválida
    """
    body = await request.body()
    headers = dict(request.headers)

    status_code, response_body = pago_service.procesar_webhook(body, headers)
    return JSONResponse(status_code=status_code, content=response_body)


@router.get("/{pedido_id}", response_model=List[PagoResponse])
async def obtener_pagos_por_pedido(
    pedido_id: int,
    current_user: UserResponse = Depends(get_current_user),
    pago_service: PagoService = Depends(get_pago_service),
):
    """
    Obtiene todos los pagos asociados a un pedido.

    Requiere autenticación JWT. Solo el propietario del pedido puede
    consultar sus pagos.

    **Args (path):**
    - ``pedido_id``: ID del pedido.

    **Returns:**
    Lista de ``PagoResponse``.
    """
    # Validar que el pedido pertenece al usuario
    from app.modules.pedidos.service import PedidoService

    pedido_service = PedidoService(pago_service.session)
    _, error = pedido_service.obtener_por_id(pedido_id, current_user.id)

    if error:
        raise HTTPException(status_code=404, detail=error)

    pagos = pago_service.repo.get_by_pedido(pedido_id)
    return [PagoService._to_response(p) for p in pagos]
