from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class DireccionCreate(BaseModel):
    """Schema para crear una nueva dirección."""
    calle: str
    numero: str
    ciudad: str
    provincia: str
    codigo_postal: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None


class DireccionUpdate(BaseModel):
    """Schema para actualizar una dirección."""
    calle: Optional[str] = None
    numero: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None


class DireccionResponse(BaseModel):
    """Schema de respuesta para una dirección."""
    id: int
    usuario_id: int
    calle: str
    numero: str
    ciudad: str
    provincia: str
    codigo_postal: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_principal: bool
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
