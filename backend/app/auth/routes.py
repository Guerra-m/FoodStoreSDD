from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.core.database import get_session
from app.auth.services import AuthService
from app.auth.dependencies import get_auth_service, get_current_user
from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    LogoutRequest,
    UserResponse,
    LoginResponse,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Registra un nuevo usuario.
    
    - **email**: Email único del usuario
    - **nombre**: Nombre del usuario
    - **password**: Contraseña (mínimo 8 caracteres)
    
    Returns:
        UserResponse sin contraseña
        
    Raises:
        400: Validación fallida (email/password inválidos)
        409: Email ya registrado
    """
    return auth_service.register(
        email=request.email,
        nombre=request.nombre,
        password=request.password
    )


@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """
    Autentica un usuario y retorna access + refresh token.
    
    - **email**: Email del usuario
    - **password**: Contraseña
    
    Returns:
        LoginResponse con user, access_token, refresh_token
        
    Raises:
        401: Credenciales inválidas
    """
    return auth_service.login(
        email=request.email,
        password=request.password
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh_token(
    request: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """
    Renueva el access token usando un refresh token (con rotación).
    
    - **refresh_token**: Refresh token opaco
    
    Returns:
        LoginResponse con nuevos tokens
        
    Raises:
        401: Refresh token inválido, revocado o expirado
    """
    return auth_service.refresh_token(
        refresh_token=request.refresh_token
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> dict:
    """
    Cierra sesión revocando el refresh token.
    
    - **refresh_token**: Refresh token opaco
    
    Returns:
        Mensaje de confirmación
        
    Raises:
        400: Refresh token no proporcionado
        401: Refresh token inválido
    """
    return auth_service.logout(
        refresh_token=request.refresh_token
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Obtiene el perfil del usuario autenticado.
    
    Requiere header: Authorization: Bearer <access_token>
    
    Returns:
        UserResponse del usuario actual
        
    Raises:
        401: Token inválido o expirado
    """
    return current_user
