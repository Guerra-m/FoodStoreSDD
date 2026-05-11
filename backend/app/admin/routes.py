from fastapi import APIRouter, Depends, status
from app.auth.dependencies import require_roles
from app.auth.schemas import UserResponse
from app.auth.roles import ROLE_ADMIN, ROLE_DELIVERY

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/test", status_code=status.HTTP_200_OK)
def admin_test(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN]))
) -> dict:
    """
    Endpoint de prueba que requiere rol Admin.
    Solo usuarios con rol Admin pueden acceder.
    
    Raises:
        401: Token inválido
        403: Usuario no tiene rol Admin
    """
    return {
        "message": f"Acceso Admin concedido a {current_user.nombre}",
        "user_id": current_user.id,
        "roles": current_user.roles
    }


@router.get("/stats", status_code=status.HTTP_200_OK)
def admin_stats(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN]))
) -> dict:
    """
    Obtiene estadísticas del sistema.
    Requiere rol Admin.
    """
    return {
        "admin": current_user.nombre,
        "stats": {
            "total_users": 0,  # Placeholder
            "total_orders": 0,  # Placeholder
            "total_revenue": 0.0  # Placeholder
        }
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
