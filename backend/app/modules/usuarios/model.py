from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List

"""
Modelo de usuario del sistema.
Gestiona identidad, autenticación y trazabilidad (soft delete).
"""


class UsuarioRole(SQLModel, table=True):
    """Tabla asociativa para relación many-to-many entre Usuario y Role."""
    __tablename__ = "usuarios_roles"
    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    role_id: int = Field(foreign_key="role.id", primary_key=True)


class Role(SQLModel, table=True):
    """Rol del sistema (Cliente, Admin, Delivery)."""
    __tablename__ = "role"
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, index=True)
    descripcion: Optional[str] = None
    creado_en: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(SQLModel, table=True):
    """Refresh token opaco almacenado como hash SHA256 para rotación y revocación."""
    __tablename__ = "refresh_token"
    id: Optional[int] = Field(default=None, primary_key=True)
    token_hash: str = Field(index=True, unique=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    expires_at: datetime
    revocado_en: Optional[datetime] = None
    creado_en: datetime = Field(default_factory=datetime.utcnow)


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    # Fecha de eliminación para borrado lógico (Soft Delete)
    eliminado_en: Optional[datetime] = None

    # Relación many-to-many con roles
    roles: List[Role] = Relationship(
        link_model=UsuarioRole,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
