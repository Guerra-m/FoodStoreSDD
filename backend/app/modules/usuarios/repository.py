from datetime import datetime, timezone
from typing import Optional, List

from sqlmodel import Session, select

from app.modules.usuarios.model import Usuario
from app.auth.models import RefreshToken


class UsuarioRepository:
    """Repositorio para operaciones de Usuario no cubiertas por BaseRepository."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> Optional[Usuario]:
        """Busca un usuario por email, incluyendo eliminados lógicos."""
        statement = select(Usuario).where(Usuario.email == email)
        return self.session.exec(statement).first()

    def get_with_roles(self, usuario_id: int) -> Optional[Usuario]:
        """Obtiene un usuario con sus roles cargados."""
        statement = select(Usuario).where(Usuario.id == usuario_id)
        return self.session.exec(statement).first()


class RefreshTokenRepository:
    """Repositorio para gestionar refresh tokens."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, token_hash: str, usuario_id: int, expires_at: datetime) -> RefreshToken:
        """Persiste un nuevo refresh token."""
        rt = RefreshToken(
            token_hash=token_hash,
            usuario_id=usuario_id,
            expires_at=expires_at,
        )
        self.session.add(rt)
        self.session.commit()
        self.session.refresh(rt)
        return rt

    def find_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Busca un refresh token por su hash."""
        statement = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
        )
        return self.session.exec(statement).first()

    def revoke(self, token: RefreshToken) -> None:
        """Revoca un refresh token (logout o rotación)."""
        token.revocado_en = datetime.now(timezone.utc)
        self.session.add(token)
        self.session.commit()

    def revoke_all_for_user(self, usuario_id: int) -> None:
        """Revoca todos los refresh tokens activos de un usuario (detección de robo)."""
        statement = select(RefreshToken).where(
            RefreshToken.usuario_id == usuario_id,
            RefreshToken.revocado_en == None,
        )
        active_tokens = self.session.exec(statement).all()
        now = datetime.now(timezone.utc)
        for token in active_tokens:
            token.revocado_en = now
            self.session.add(token)
        self.session.commit()
