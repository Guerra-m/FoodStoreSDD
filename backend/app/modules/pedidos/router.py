"""
Router para el módulo de Pedidos
"""
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, status, Query, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.core.database import get_session
from app.core.config import settings
from app.core.websocket_manager import manager
from app.modules.pedidos.schema import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoHistorialResponse,
    TransicionRequest,
)
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.fsm import OrderFSM
from app.modules.pedidos.model import Pedido
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserResponse
from app.auth.security import verify_jwt_token, extract_roles_from_token


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

    # Guardar estado anterior antes de la transición
    estado_anterior = None
    pedido_db = pedido_service.repo.get_by_id(pedido_id)
    if pedido_db:
        estado_anterior = pedido_db.estado

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

    # Broadcast del evento a clientes WebSocket suscriptos
    evento = {
        "type": "estado_actualizado",
        "pedido_id": pedido_id,
        "estado_anterior": estado_anterior or resultado.estado,
        "estado_nuevo": resultado.estado,
        "descripcion": OrderFSM.get_description_for_action(
            transicion_data.accion, resultado.estado
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "historial": [
            {
                "estado": h.estado,
                "descripcion": h.descripcion,
                "timestamp": h.timestamp.isoformat() if hasattr(h.timestamp, 'isoformat') else str(h.timestamp),
                "usuario_id": h.usuario_id,
            }
            for h in resultado.historial
        ],
    }

    # Broadcast a la sala del pedido (tracking del cliente)
    await manager.broadcast(pedido_id=pedido_id, data=evento)

    # Broadcast a la sala global de admins (Kanban board)
    await manager.broadcast_admin(data={
        "type": "order_updated",
        "order": {
            "id": pedido_id,
            "estado": resultado.estado,
            "estado_anterior": estado_anterior or resultado.estado,
            "cliente_nombre": getattr(pedido_db, "cliente_nombre", "") if pedido_db else "",
            "total": resultado.total,
            "items_count": len(resultado.items) if hasattr(resultado, "items") and resultado.items else 0,
            "creado_en": resultado.creado_en.isoformat() if hasattr(resultado.creado_en, "isoformat") else str(resultado.creado_en),
        },
    })

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


@router.websocket("/ws/{pedido_id}")
async def websocket_pedido(
    websocket: WebSocket,
    pedido_id: int,
    token: str = "",
    session: Session = Depends(get_session),
):
    """
    WebSocket para tracking en tiempo real de un pedido.
    Endpoint: WS /api/v1/pedidos/ws/{pedido_id}?token={jwt}

    Recibe el JWT como query param `token` (los browsers no permiten
    custom headers en el handshake de WebSocket).

    - Cliente autenticado: solo puede escuchar sus propios pedidos.
    - Admin autenticado: puede escuchar cualquier pedido.
    - Token inválido/expirado: conexión rechazada con código 4001.
    - Pedido no existe o no autorizado: conexión rechazada con código 4003.

    Formato del mensaje enviado (JSON):
    ```json
    {
        "type": "estado_actualizado",
        "pedido_id": 123,
        "estado_anterior": "pendiente",
        "estado_nuevo": "pagado",
        "descripcion": "Pago confirmado",
        "timestamp": "2026-05-26T16:00:00Z",
        "historial": [...]
    }
    ```
    """
    # 1. Validar token JWT
    payload = verify_jwt_token(token, settings.SECRET_KEY)
    if payload is None:
        await websocket.close(code=4001, reason="Token inválido o expirado")
        return

    user_id = int(payload.get("sub", 0))
    roles = extract_roles_from_token(payload)
    is_admin = "Admin" in roles

    # 2. Validar que el pedido exista
    pedido = session.get(Pedido, pedido_id)
    if not pedido:
        await websocket.close(code=4003, reason="Pedido no encontrado")
        return

    # 3. Validar autorización: admin puede ver cualquier pedido,
    #    cliente solo los suyos
    if not is_admin and pedido.cliente_id != user_id:
        await websocket.close(code=4003, reason="No autorizado para ver este pedido")
        return

    # 4. Suscribir al manager
    try:
        await manager.connect(pedido_id, websocket)
        # Mantener conexión abierta — el cliente no envía mensajes,
        # solo recibe broadcasts. El loop detecta disconnects.
        while True:
            # Esperar cualquier mensaje del cliente (heartbeat o desconexión)
            data = await websocket.receive_text()
            # Si el cliente envía "ping", responder "pong"
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        # Cleanup graceful
        await manager.disconnect(pedido_id, websocket)
    except Exception:
        # Error inesperado, limpiar igual
        await manager.disconnect(pedido_id, websocket)


@router.websocket("/admin/ws")
async def websocket_admin(
    websocket: WebSocket,
    token: str = "",
    session: Session = Depends(get_session),
):
    """
    WebSocket para broadcast de TODOS los cambios de estado de pedidos
    a administradores. Usado por el Kanban board de admin.

    Endpoint: WS /api/v1/pedidos/admin/ws?token={jwt}

    Solo usuarios con rol Admin pueden conectarse.
    Reciben mensajes type "order_updated" cuando cualquier pedido cambia.

    Formato del mensaje:
    ```json
    {
        "type": "order_updated",
        "order": {
            "id": 5,
            "estado": "preparando",
            "estado_anterior": "pagado",
            "cliente_nombre": "Juan Pérez",
            "total": 25000,
            "items_count": 3,
            "creado_en": "2026-05-26T10:00:00"
        }
    }
    ```
    """
    # 1. Validar token JWT
    payload = verify_jwt_token(token, settings.SECRET_KEY)
    if payload is None:
        await websocket.close(code=4001, reason="Token inválido o expirado")
        return

    # 2. Verificar rol admin
    roles = extract_roles_from_token(payload)
    if "Admin" not in roles:
        await websocket.close(code=4003, reason="Se requiere rol Admin")
        return

    # 3. Conectar al canal global de admins
    try:
        await manager.connect_admin(websocket)
        # Mantener conexión abierta — el admin solo recibe broadcasts
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect_admin(websocket)
    except Exception:
        await manager.disconnect_admin(websocket)