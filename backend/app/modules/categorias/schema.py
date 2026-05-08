from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class CategoriaCreate(BaseModel):
    """Schema para crear una nueva categoría."""
    nombre: str
    padre_id: Optional[int] = None
    posicion: Optional[int] = None


class CategoriaUpdate(BaseModel):
    """Schema para actualizar una categoría."""
    nombre: Optional[str] = None
    padre_id: Optional[int] = None
    posicion: Optional[int] = None


class CategoriaResponse(BaseModel):
    """Schema público de una categoría."""
    id: int
    nombre: str
    padre_id: Optional[int] = None
    posicion: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class CategoriaTreeResponse(BaseModel):
    """Schema para respuesta de árbol jerárquico."""
    id: int
    nombre: str
    padre_id: Optional[int] = None
    posicion: int
    hijos: List["CategoriaTreeResponse"] = []

    class Config:
        from_attributes = True


class CategoriaListResponse(BaseModel):
    """Schema para lista de categorías."""
    categorias: List[CategoriaResponse]
    total: int