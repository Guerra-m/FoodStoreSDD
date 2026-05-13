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
)
from app.modules.pedidos.service import PedidoService
from app.auth.dependencies import get_current_user
from app.modules.usuarios.model import Usuario


router = APIRouter(prefix="/api/v1/pedidos", tags=["pedidos"])


def get_pedido_service(session: Session = Depends(get_session)) -> PedidoService:
    """Dependency para obtener el servicio de pedidos."""
    return PedidoService(session)


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def crear_pedido(
    pedido_data: PedidoCreate,
    current_user: Usuario = Depends(get_current_user),
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
    current_user: Usuario = Depends(get_current_user),
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
    current_user: Usuario = Depends(get_current_user),
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


@router.get("/{pedido_id}/historial", response_model=List[PedidoHistorialResponse])
async def obtener_historial(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
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