"""
Router para el módulo de Pedidos
"""
from typing import Optional, List

from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session

from app.core.database import get_session
from app.modules.pedidos.schema import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoHistorialResponse,
    TransicionRequest,
)
from app.modules.pedidos.service import PedidoService
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserResponse


router = APIRouter(prefix="/api/v1/pedidos", tags=["pedidos"])


def get_pedido_service(session: Session = Depends(get_session)) -> PedidoService:
    """Dependency para obtener el servicio de pedidos."""
    return PedidoService(session)


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def crear_pedido(
    pedido_data: PedidoCreate,
    current_user: UserResponse = Depends(get_current_user),
    pedido_service: PedidoService = Depends(get_pedido_service),
):
    """
    Crea un nuevo pedido.
    
    Requiere autenticación.
    """
    resultado, error = pedido_service.crear_pedido(
        cliente_id=current_user.id,
        pedido_data=pedido_data,
    )
    
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=error)
    
    return resultado


@router.get("", response_model=PedidoListResponse)
async def listar_pedidos(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    pedido_service: PedidoService = Depends(get_pedido_service),
):
    """
    Lista los pedidos del cliente autenticado.
    
    Requiere autenticación.
    """
    return pedido_service.listar_por_cliente(
        cliente_id=current_user.id,
        page=page,
        per_page=per_page,
    )


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def obtener_pedido(
    pedido_id: int,
    current_user: UserResponse = Depends(get_current_user),
    pedido_service: PedidoService = Depends(get_pedido_service),
):
    """
    Obtiene el detalle de un pedido.
    
    Requiere autenticación. Solo puede acceder el propietario.
    """
    from fastapi import HTTPException
    
    resultado, error = pedido_service.obtener_por_id(
        pedido_id=pedido_id,
        cliente_id=current_user.id,
    )
    
    if error:
        raise HTTPException(status_code=404, detail=error)
    
    return resultado


@router.post("/{pedido_id}/transicion", response_model=PedidoResponse)
async def transicionar_estado(
    pedido_id: int,
    transicion_data: TransicionRequest,
    current_user: UserResponse = Depends(get_current_user),
    pedido_service: PedidoService = Depends(get_pedido_service),
):
    """
    Transiciona un pedido a un nuevo estado.

    Acciones válidas: pagar, preparar, enviar, entregar, cancelar.
    Requiere autenticación. Las acciones están sujetas al rol del usuario
    y al estado actual del pedido según la FSM.

    - **Cliente**: solo puede cancelar pedidos propios en estado "pendiente"
    - **Admin**: puede ejecutar todas las acciones válidas
    - **Sistema**: puede ejecutar "pagar" (para integración con webhooks)
    """
    from fastapi import HTTPException

    # Determinar el rol efectivo: si tiene "Admin", se comporta como admin
    # Caso contrario, se comporta como cliente
    usuario_rol = "Admin" if "Admin" in current_user.roles else "Cliente"

    resultado, error, status_code = pedido_service.transicionar_estado(
        pedido_id=pedido_id,
        accion=transicion_data.accion,
        usuario_id=current_user.id,
        usuario_rol=usuario_rol,
    )

    if error:
        raise HTTPException(
            status_code=status_code or 400,
            detail=error,
        )

    return resultado


@router.get("/{pedido_id}/historial", response_model=List[PedidoHistorialResponse])
async def obtener_historial(
    pedido_id: int,
    current_user: UserResponse = Depends(get_current_user),
    pedido_service: PedidoService = Depends(get_pedido_service),
):
    """
    Obtiene el historial de cambios de estado de un pedido.
    
    Requiere autenticación. Solo puede acceder el propietario.
    """
    from fastapi import HTTPException
    
    resultado, error = pedido_service.obtener_historial(
        pedido_id=pedido_id,
        cliente_id=current_user.id,
    )
    
    if error:
        raise HTTPException(status_code=404, detail=error)
    
    return resultado