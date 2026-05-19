from sqlmodel import SQLModel, Field
from datetime import datetime, date
from typing import Optional


class User(SQLModel):
    """Usuario del sistema — modelo no-table para compatibilidad.
    
    La tabla real 'usuario' es gestionada por Usuario (app.modules.usuarios.model).
    """
    id: Optional[int] = None
    email: str = ""
    nombre: str = ""
    password_hash: str = ""
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    # Timestamps
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    # Soft delete
    eliminado_en: Optional[datetime] = None


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
