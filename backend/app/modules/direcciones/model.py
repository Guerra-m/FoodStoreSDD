from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List


class Direccion(SQLModel, table=True):
    """Dirección de entrega asociada a un usuario (cliente)."""
    __tablename__ = "direccion"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    calle: str
    numero: str
    ciudad: str
    provincia: str
    codigo_postal: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_principal: bool = Field(default=False)

    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
