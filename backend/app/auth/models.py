from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List


class User(SQLModel, table=True):
    __table_args__ = {'extend_existing': True}
    """Usuario del sistema con soporte para múltiples roles."""
    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field()  # Índice y unique definidos en Usuario (misma tabla)
    nombre: str
    password_hash: str  # Campo de contraseña
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    # Soft delete
    eliminado_en: Optional[datetime] = None

    # Relación con refresh tokens
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="usuario")


class RefreshToken(SQLModel, table=True):
    __table_args__ = {'extend_existing': True}
    """Refresh token para rotación segura de sesiones."""
    __tablename__ = "refresh_token"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    token_hash: str = Field(index=True, unique=True)  # Hash SHA256 del token
    expires_at: datetime
    revocado_en: Optional[datetime] = None  # NULL si no revocado, fecha si revocado
    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)

    # Relación con usuario
    usuario: User = Relationship(back_populates="refresh_tokens")
