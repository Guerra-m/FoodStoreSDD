import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import select

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
)
from app.core.config import settings
from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.model import Usuario, Role, UsuarioRole
from app.auth.models import RefreshToken
from app.modules.usuarios.schema import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    LoginResponse,
    UserResponse,
    ChangePasswordRequest,
)
from app.modules.usuarios.repository import UsuarioRepository, RefreshTokenRepository


class AuthService:
    """Servicio de autenticación: registro, login, refresh token rotation, logout."""

    async def change_password(self, usuario_id: int, data: ChangePasswordRequest) -> None:
        """Cambia la contraseña del usuario."""
        with UnitOfWork() as uow:
            usuario_repo = UsuarioRepository(uow.session)
            usuario = usuario_repo.get_by_id(usuario_id)
            
            if not usuario or not verify_password(data.current_password, usuario.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contraseña actual incorrecta",
                )
            
            usuario.password_hash = hash_password(data.new_password)
            uow.session.add(usuario)

    async def register(self, data: RegisterRequest) -> UserResponse:
        """Registra un nuevo usuario con rol Cliente por defecto."""
        usuario_id: int = None  # type: ignore
        with UnitOfWork() as uow:
            usuario_repo = UsuarioRepository(uow.session)
            existing = usuario_repo.get_by_email(data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El email ya está registrado",
                )

            # Buscar el rol Cliente (se crea via seed)
            statement = select(Role).where(Role.nombre == "Cliente")
            role_cliente = uow.session.exec(statement).first()
            if not role_cliente:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Rol Cliente no encontrado. Ejecutar seed primero.",
                )

            usuario = Usuario(
                nombre=data.nombre,
                email=data.email,
                password_hash=hash_password(data.password),
                telefono=data.telefono,
            )
            uow.session.add(usuario)
            uow.session.flush()  # para obtener el id
            # Guardar el id antes de que se cierre la sesion
            usuario_id = usuario.id

            # Asignar rol Cliente
            usuario_role = UsuarioRole(usuario_id=usuario_id, role_id=role_cliente.id)
            uow.session.add(usuario_role)

        return UserResponse(
            id=usuario_id,
            nombre=data.nombre,
            email=data.email,
            telefono=data.telefono,
            roles=["Cliente"],
            creado_en=datetime.now(timezone.utc),
            actualizado_en=datetime.now(timezone.utc),
        )

    async def login(self, data: LoginRequest, user_agent: str = "") -> LoginResponse:
        """Autentica usuario y devuelve tokens + datos del usuario."""
        with UnitOfWork() as uow:
            usuario_repo = UsuarioRepository(uow.session)
            usuario = usuario_repo.get_by_email(data.email)

            if not usuario or not verify_password(data.password, usuario.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email o contraseña incorrectos",
                )

            if usuario.eliminado_en:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Cuenta desactivada",
                )

            # Cargar roles
            # La relación lazy="selectin" ya carga roles automaticamente
            roles = [r.nombre for r in usuario.roles] if usuario.roles else []

            # Generar tokens
            access_token = create_access_token(
                sub=str(usuario.id),
                roles=roles,
            )

            raw_refresh, refresh_hash = generate_refresh_token()
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            refresh_repo = RefreshTokenRepository(uow.session)
            refresh_repo.create(
                token_hash=refresh_hash,
                usuario_id=usuario.id,
                expires_at=expires_at,
            )

            # Leer datos del usuario ANTES de que se cierre la sesión
            user_response = UserResponse(
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

        return LoginResponse(
            user=user_response,
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, raw_refresh_token: str) -> LoginResponse:
        """Refresca el access token con rotación. Detecta reuso de token revocado."""
        with UnitOfWork() as uow:
            refresh_repo = RefreshTokenRepository(uow.session)
            token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
            stored = refresh_repo.find_by_hash(token_hash)

            if stored is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token inválido",
                )

            # Detección de robo: si ya fue revocado, revocar TODOS los del usuario
            if stored.revocado_en is not None:
                refresh_repo.revoke_all_for_user(stored.usuario_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token reutilizado. Todos los tokens han sido revocados.",
                )

            # Verificar expiración
            # SQLite almacena sin timezone, así que comparamos naive con naive
            if stored.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token expirado",
                )

            # Revocar el token actual (rotación)
            refresh_repo.revoke(stored)

            # Cargar usuario con roles
            usuario_repo = UsuarioRepository(uow.session)
            usuario = usuario_repo.get_with_roles(stored.usuario_id)
            if not usuario or usuario.eliminado_en:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no encontrado o desactivado",
                )

            roles = [r.nombre for r in usuario.roles] if usuario.roles else []

            # Emitir nuevo par
            access_token = create_access_token(
                sub=str(usuario.id),
                roles=roles,
            )
            new_raw, new_hash = generate_refresh_token()
            new_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            refresh_repo.create(
                token_hash=new_hash,
                usuario_id=usuario.id,
                expires_at=new_expires,
            )

            # Leer datos del usuario ANTES de que se cierre la sesión
            user_response = UserResponse(
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

        return LoginResponse(
            user=user_response,
            access_token=access_token,
            refresh_token=new_raw,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, raw_refresh_token: str) -> dict:
        """Revoca un refresh token (cierre de sesión)."""
        with UnitOfWork() as uow:
            refresh_repo = RefreshTokenRepository(uow.session)
            token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
            stored = refresh_repo.find_by_hash(token_hash)

            if stored and stored.revocado_en is None:
                refresh_repo.revoke(stored)

        return {"message": "Sesión cerrada exitosamente"}
