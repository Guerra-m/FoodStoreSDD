from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.core.database import get_session
from app.core.config import settings
from app.auth.services import AuthService
from app.auth.security import extract_token_from_header
from app.auth.schemas import UserResponse

security = HTTPBearer()


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    """
    Obtiene una instancia del AuthService con sesión de BD.
    """
    return AuthService(
        session=session,
        secret_key=settings.JWT_SECRET_KEY,
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
    return auth_service.get_current_user(token)
