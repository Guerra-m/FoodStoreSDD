"""
Router principal de administración.
Incluye sub-routers para dashboard, usuarios y pedidos.
Mantiene los endpoints legacy para compatibilidad.
"""
from fastapi import APIRouter, Depends, status, Query, Path, Body
from sqlmodel import Session

from app.core.database import get_session
from app.auth.dependencies import require_roles, get_current_user
from app.auth.schemas import UserResponse
from app.auth.roles import ROLE_ADMIN, ROLE_DELIVERY

# Schemas
from app.admin.schemas import (
    DashboardStats,
    RevenueResponse,
    TopProductsResponse,
    OrdersByStatusResponse,
    UserAdminListResponse,
    UserAdminResponse,
    UpdateRolesRequest,
    AdminOrderListResponse,
    AdminOrderDetail,
    UpdateOrderStatusRequest,
)

# Services
from app.admin.services.dashboard_service import DashboardService
from app.admin.services.user_service import UserAdminService
from app.admin.services.order_service import OrderAdminService

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_dashboard_service(session: Session = Depends(get_session)) -> DashboardService:
    return DashboardService(session)


def get_user_admin_service(session: Session = Depends(get_session)) -> UserAdminService:
    return UserAdminService(session)


def get_order_admin_service(session: Session = Depends(get_session)) -> OrderAdminService:
    return OrderAdminService(session)


# ─── Legacy endpoints (mantenidos para compatibilidad) ──────────────────────

@router.get("/test", status_code=status.HTTP_200_OK)
def admin_test(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN]))
) -> dict:
    """
    Endpoint de prueba que requiere rol Admin.
    Solo usuarios con rol Admin pueden acceder.
    """
    return {
        "message": f"Acceso Admin concedido a {current_user.nombre}",
        "user_id": current_user.id,
        "roles": current_user.roles
    }


@router.get("/stats", status_code=status.HTTP_200_OK)
def admin_stats(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> dict:
    """
    Obtiene estadísticas del sistema.
    Requiere rol Admin.
    """
    stats = dashboard_service.get_stats()
    return {
        "admin": current_user.nombre,
        "stats": stats.model_dump()
    }


@router.get("/delivery-dashboard", status_code=status.HTTP_200_OK)
def delivery_dashboard(
    current_user: UserResponse = Depends(require_roles([ROLE_DELIVERY, ROLE_ADMIN]))
) -> dict:
    """
    Dashboard de entregas.
    Requiere rol Delivery o Admin.
    """
    return {
        "user": current_user.nombre,
        "roles": current_user.roles,
        "pending_deliveries": 0  # Placeholder
    }


# ─── Dashboard Endpoints ───────────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Obtiene métricas globales del dashboard."""
    return dashboard_service.get_stats()


@router.get("/dashboard/revenue", response_model=RevenueResponse)
def get_dashboard_revenue(
    period: str = Query("daily", regex="^(daily|monthly)$"),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Obtiene ingresos en el tiempo (daily=30 días, monthly=12 meses)."""
    result = dashboard_service.get_revenue(period)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Período inválido: {period}")
    return result


@router.get("/dashboard/top-products", response_model=TopProductsResponse)
def get_dashboard_top_products(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Obtiene los 10 productos más vendidos."""
    return dashboard_service.get_top_products()


@router.get("/dashboard/orders-by-status", response_model=OrdersByStatusResponse)
def get_dashboard_orders_by_status(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Obtiene distribución de pedidos por estado."""
    return dashboard_service.get_orders_by_status()


# ─── User Management Endpoints ─────────────────────────────────────────────

@router.get("/users", response_model=UserAdminListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Búsqueda por email"),
    role: str = Query(None, description="Filtrar por nombre de rol"),
    include_deleted: bool = Query(False, description="Incluir usuarios eliminados"),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    user_service: UserAdminService = Depends(get_user_admin_service),
):
    """Lista usuarios del sistema con paginación y filtros."""
    return user_service.list_users(
        page=page,
        per_page=per_page,
        search=search,
        role=role,
        include_deleted=include_deleted,
    )


@router.get("/users/{user_id}", response_model=UserAdminResponse)
def get_user(
    user_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    user_service: UserAdminService = Depends(get_user_admin_service),
):
    """Obtiene detalle completo de un usuario."""
    result, error, status_code = user_service.get_user_by_id(user_id)
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 404, detail=error)
    return result


@router.put("/users/{user_id}/roles", response_model=UserAdminResponse)
def update_user_roles(
    roles_data: UpdateRolesRequest,
    user_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    user_service: UserAdminService = Depends(get_user_admin_service),
):
    """Actualiza los roles de un usuario."""
    result, error, status_code = user_service.update_roles(user_id, roles_data)
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 400, detail=error)
    return result


@router.delete("/users/{user_id}", response_model=UserAdminResponse)
def delete_user(
    user_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    user_service: UserAdminService = Depends(get_user_admin_service),
):
    """Realiza soft delete de un usuario."""
    result, error, status_code = user_service.soft_delete_user(user_id)
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 400, detail=error)
    return result


@router.post("/users/{user_id}/restore", response_model=UserAdminResponse)
def restore_user(
    user_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    user_service: UserAdminService = Depends(get_user_admin_service),
):
    """ restaura un usuario eliminado."""
    result, error, status_code = user_service.restore_user(user_id)
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 400, detail=error)
    return result


# ─── Order Management Endpoints ────────────────────────────────────────────

@router.get("/orders", response_model=AdminOrderListResponse)
def list_admin_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    estado: str = Query(None, description="Filtrar por estado del pedido"),
    date_from: str = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    cliente_id: int = Query(None, ge=1, description="Filtrar por cliente"),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    order_service: OrderAdminService = Depends(get_order_admin_service),
):
    """Lista pedidos con paginación y filtros."""
    return order_service.list_orders(
        page=page,
        per_page=per_page,
        estado=estado,
        date_from=date_from,
        date_to=date_to,
        cliente_id=cliente_id,
    )


@router.get("/orders/{order_id}", response_model=AdminOrderDetail)
def get_admin_order_detail(
    order_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    order_service: OrderAdminService = Depends(get_order_admin_service),
):
    """Obtiene detalle completo de un pedido."""
    result, error, status_code = order_service.get_order_detail(order_id)
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 404, detail=error)
    return result


@router.put("/orders/{order_id}/status", response_model=AdminOrderDetail)
def update_order_status(
    status_data: UpdateOrderStatusRequest,
    order_id: int = Path(..., ge=1),
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN])),
    order_service: OrderAdminService = Depends(get_order_admin_service),
):
    """
    Cambia el estado de un pedido usando acciones FSM.
    Acciones válidas: pagar, preparar, enviar, entregar, cancelar.
    """
    result, error, status_code = order_service.update_order_status(
        pedido_id=order_id,
        accion=status_data.accion,
        usuario_id=current_user.id,
    )
    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=status_code or 400, detail=error)
    return result
