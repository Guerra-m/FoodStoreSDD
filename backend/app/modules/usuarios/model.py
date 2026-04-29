from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

"""
Modelo de usuario del sistema.
Gestiona identidad, autenticación y trazabilidad (soft delete).
"""

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    telefono: Optional[str] = None
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    # Fecha de eliminación para borrado lógico (Soft Delete)
    eliminado_en: Optional[datetime] = None
