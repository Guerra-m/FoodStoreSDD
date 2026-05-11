from datetime import datetime, timedelta
from typing import Optional, List
from sqlmodel import Session, select
from app.auth.models import User, RefreshToken
from app.auth.schemas import UserResponse, LoginResponse
from app.auth.roles import ROLE_CLIENTE
from app.auth.security import (
    hash_password,
    verify_password,
    generate_random_token,
    hash_token,
    validate_email_format,
    validate_password_strength,
    create_access_token,
    create_access_token_with_roles,
    extract_roles_from_token,
    verify_jwt_token,
)
from app.modules.usuarios.model import UsuarioRole, Role
from fastapi import HTTPException, status


class AuthService:
    """Servicio de autenticación con JWT y refresh token rotation."""

    def __init__(self, session: Session, secret_key: str, access_token_expire_minutes: int, refresh_token_expire_days: int):
        self.session = session
        self.secret_key = secret_key
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days

    def _get_user_roles(self, user_id: int) -> List[str]:
        """
        Obtiene la lista de nombres de roles asignados a un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de nombres de roles
        """
        # Buscar roles asociados al usuario
        user_roles = self.session.exec(
            select(Role).join(UsuarioRole).where(UsuarioRole.usuario_id == user_id)
        ).all()
        
        return [role.nombre for role in user_roles]

    def register(self, email: str, nombre: str, password: str) -> UserResponse:
        """
        Registra un nuevo usuario y asigna rol "Cliente" automáticamente.
        
        Args:
            email: Email del usuario
            nombre: Nombre del usuario
            password: Contraseña en texto plano
            
        Returns:
            UserResponse con roles incluidos
            
        Raises:
            HTTPException 400: Si validación falla
            HTTPException 409: Si email ya existe
        """
        # Validar email
        if not validate_email_format(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email inválido"
            )
        
        # Validar contraseña
        is_valid, message = validate_password_strength(password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Verificar que email no existe
        existing_user = self.session.exec(
            select(User).where(User.email == email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email ya registrado"
            )
        
        # Crear usuario con password hasheado
        hashed_pwd = hash_password(password)
        new_user = User(
            email=email,
            nombre=nombre,
            password_hash=hashed_pwd
        )
        
        self.session.add(new_user)
        self.session.flush()  # Flush para obtener el ID
        
        # Asignar rol "Cliente" automáticamente
        user_roles = []
        cliente_role = self.session.exec(
            select(Role).where(Role.nombre == ROLE_CLIENTE)
        ).first()
        
        if cliente_role:
            user_role = UsuarioRole(usuario_id=new_user.id, role_id=cliente_role.id)
            self.session.add(user_role)
            user_roles.append(ROLE_CLIENTE)
        
        self.session.commit()
        self.session.refresh(new_user)
        
        # Retornar UserResponse con roles
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            nombre=new_user.nombre,
            roles=user_roles,
            creado_en=new_user.creado_en
        )

    def login(self, email: str, password: str) -> LoginResponse:
        """
        Autentica un usuario y retorna access + refresh token con roles incluidos.
        
        Args:
            email: Email del usuario
            password: Contraseña en texto plano
            
        Returns:
            LoginResponse con tokens (JWT contiene "roles" claim)
            
        Raises:
            HTTPException 401: Si credenciales son inválidas
        """
        # Buscar usuario
        user = self.session.exec(
            select(User).where(User.email == email)
        ).first()
        
        # Respuesta genérica para privacidad (no revelar si email existe)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        # Obtener roles del usuario
        user_roles = self._get_user_roles(user.id)
        
        # Generar access token con roles como claim
        access_token = create_access_token_with_roles(
            data={"sub": str(user.id)},
            roles=user_roles,
            secret_key=self.secret_key,
            expires_delta=timedelta(minutes=self.access_token_expire_minutes)
        )
        
        # Generar y almacenar refresh token
        refresh_token = generate_random_token()
        refresh_token_hash = hash_token(refresh_token)
        
        db_refresh_token = RefreshToken(
            usuario_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        )
        
        self.session.add(db_refresh_token)
        self.session.commit()
        
        # Construir UserResponse con roles
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            roles=user_roles,
            creado_en=user.creado_en
        )
        
        return LoginResponse(
            user=user_response,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self.access_token_expire_minutes * 60  # segundos
        )

    def refresh_token(self, refresh_token: str) -> LoginResponse:
        """
        Renueva el access token usando un refresh token (con rotación).
        Si el refresh token fue revocado (robo detectado), revoca todos los tokens del usuario.
        Los roles se obtienen frescos de la BD para reflejar cambios.
        
        Args:
            refresh_token: Refresh token opaco
            
        Returns:
            LoginResponse con nuevos tokens (JWT incluye roles actuales)
            
        Raises:
            HTTPException 401: Si refresh token es inválido o revocado
        """
        # Hash del token para búsqueda en BD
        token_hash = hash_token(refresh_token)
        
        # Buscar refresh token
        db_refresh_token = self.session.exec(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        ).first()
        
        if not db_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido"
            )
        
        # Verificar que no está revocado
        if db_refresh_token.revocado_en is not None:
            # Token fue revocado (posible robo detectado)
            # Revocar TODOS los tokens del usuario como medida de seguridad
            all_tokens = self.session.exec(
                select(RefreshToken).where(
                    RefreshToken.usuario_id == db_refresh_token.usuario_id,
                    RefreshToken.revocado_en == None
                )
            ).all()
            
            for token in all_tokens:
                token.revocado_en = datetime.utcnow()
            
            self.session.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token revocado - robo posible. Re-auténtiquese."
            )
        
        # Verificar expiración
        if datetime.utcnow() > db_refresh_token.expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expirado"
            )
        
        # Obtener usuario
        user = self.session.get(User, db_refresh_token.usuario_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        # Obtener roles actuales del usuario
        user_roles = self._get_user_roles(user.id)
        
        # Revocar refresh token antiguo
        db_refresh_token.revocado_en = datetime.utcnow()
        
        # Generar nuevos tokens con roles actuales
        new_access_token = create_access_token_with_roles(
            data={"sub": str(user.id)},
            roles=user_roles,
            secret_key=self.secret_key,
            expires_delta=timedelta(minutes=self.access_token_expire_minutes)
        )
        
        new_refresh_token = generate_random_token()
        new_refresh_token_hash = hash_token(new_refresh_token)
        
        new_db_refresh_token = RefreshToken(
            usuario_id=user.id,
            token_hash=new_refresh_token_hash,
            expires_at=datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        )
        
        self.session.add(new_db_refresh_token)
        self.session.commit()
        
        # Construir UserResponse con roles actuales
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            roles=user_roles,
            creado_en=user.creado_en
        )
        
        return LoginResponse(
            user=user_response,
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=self.access_token_expire_minutes * 60
        )

    def logout(self, refresh_token: str) -> dict:
        """
        Revoca un refresh token (logout).
        
        Args:
            refresh_token: Refresh token opaco
            
        Returns:
            Dict con mensaje de confirmación
            
        Raises:
            HTTPException 400: Si refresh token no proporcionado
            HTTPException 401: Si refresh token inválido
        """
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token requerido"
            )
        
        token_hash = hash_token(refresh_token)
        
        db_refresh_token = self.session.exec(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        ).first()
        
        if not db_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido"
            )
        
        # Marcar como revocado
        db_refresh_token.revocado_en = datetime.utcnow()
        self.session.commit()
        
        return {"message": "Logout exitoso"}

    def get_current_user(self, access_token: str) -> dict:
        """
        Obtiene el usuario actual validando el access token.
        Extrae roles del JWT claim (no necesita consulta a BD).
        
        Args:
            access_token: JWT token
            
        Returns:
            Dict con user_id, email, nombre y roles extraídos del JWT
            
        Raises:
            HTTPException 401: Si token inválido o expirado
        """
        # Verificar JWT
        payload = verify_jwt_token(access_token, self.secret_key)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Obtener usuario
        user = self.session.get(User, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        # Extraer roles del JWT claim (lista de strings)
        roles = payload.get("roles", [])
        
        return {
            "user_id": user.id,
            "email": user.email,
            "nombre": user.nombre,
            "roles": roles,
            "creado_en": user.creado_en
        }
