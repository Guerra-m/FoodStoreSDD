from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.core.database import get_session
from app.core.config import settings
from app.auth.services import AuthService
from app.auth.security import extract_token_from_header
from app.auth.schemas import UserResponse

security = HTTPBearer(auto_error=False)


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    """
    Obtiene una instancia del AuthService con sesión de BD.
    """
    return AuthService(
        session=session,
        secret_key=settings.SECRET_KEY,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Obtiene el usuario actual del JWT token.
    Requiere header "Authorization: Bearer <token>"
    
    Returns:
        UserResponse con datos del usuario extraídos del JWT
    
    Raises:
        HTTPException 401: Si token no válido
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autorización requerida",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    user_data = auth_service.get_current_user(token)
    
    # Convertir dict a UserResponse
    return UserResponse(
        id=user_data["user_id"],
        email=user_data["email"],
        nombre=user_data["nombre"],
        roles=user_data.get("roles", []),
        telefono=user_data.get("telefono"),
        foto_url=user_data.get("foto_url"),
        fecha_nacimiento=user_data.get("fecha_nacimiento"),
        creado_en=user_data.get("creado_en")
    )


def require_roles(required_roles: List[str]):
    """
    Crea un dependency que valida que el usuario tiene al menos uno de los roles requeridos.
    
    Args:
        required_roles: Lista de nombres de roles permitidos (ej: ["Admin", "Delivery"])
        
    Returns:
        Dependency que retorna UserResponse si tiene roles requeridos
        
    Raises:
        HTTPException 401: Si sin autenticación
        HTTPException 403: Si usuario no tiene roles requeridos
        
    Ejemplo:
        @router.get("/admin/stats")
        def get_stats(user: UserResponse = Depends(require_roles(["Admin"]))):
            # user.roles contiene los roles del usuario
            return {"message": "Admin access granted"}
    """
    def check_roles(user: UserResponse = Depends(get_current_user)) -> UserResponse:
        """Valida que el usuario tiene al menos un rol requerido."""
        user_roles = user.roles
        
        # Verificar si el usuario tiene al menos uno de los roles requeridos
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Roles requeridos: {', '.join(required_roles)}"
            )
        
        return user
    
    return check_roles
