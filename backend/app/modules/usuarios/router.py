from fastapi import APIRouter, Depends, Request, HTTPException, status

from app.core.security import get_current_user
from app.modules.usuarios.schema import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
    ClientePerfilUpdate,
    ChangePasswordRequest,
)
from app.modules.usuarios.service import AuthService
from app.modules.usuarios.cliente_service import ClienteService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
auth_service = AuthService()
cliente_service = ClienteService()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest):
    """Registra un nuevo usuario con rol Cliente por defecto."""
    return await auth_service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, request: Request):
    """Inicia sesión y devuelve access + refresh tokens."""
    user_agent = request.headers.get("user-agent", "")
    return await auth_service.login(data, user_agent=user_agent)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest):
    """Refresca el access token usando un refresh token válido (rotación)."""
    return await auth_service.refresh(data.refresh_token)


@router.post("/logout")
async def logout(data: RefreshRequest):
    """Revoca el refresh token (cierre de sesión)."""
    return await auth_service.logout(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(payload: dict = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    from app.modules.usuarios.repository import UsuarioRepository
    from app.core.database import Session, engine

    usuario_id = int(payload.get("sub"))
    with Session(engine) as session:
        repo = UsuarioRepository(session)
        usuario = repo.get_with_roles(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        roles = [r.nombre for r in usuario.roles] if usuario.roles else []
        return UserResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            telefono=usuario.telefono,
            foto_url=usuario.foto_url,
            fecha_nacimiento=usuario.fecha_nacimiento,
            roles=roles,
            creado_en=usuario.creado_en,
            actualizado_en=usuario.actualizado_en,
        )



@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: ClientePerfilUpdate,
    payload: dict = Depends(get_current_user),
):
    """Actualiza el perfil del usuario autenticado (nombre, teléfono, foto, fecha de nacimiento)."""
    usuario_id = int(payload.get("sub"))
    return await cliente_service.actualizar_perfil(usuario_id, data)


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    data: ChangePasswordRequest,
    payload: dict = Depends(get_current_user),
):
    """Cambia la contraseña del usuario autenticado."""
    usuario_id = int(payload.get("sub"))
    await auth_service.change_password(usuario_id, data)
    return {"message": "Contraseña actualizada exitosamente"}
