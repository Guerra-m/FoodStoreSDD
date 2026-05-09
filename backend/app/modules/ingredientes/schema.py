from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

class IngredienteCreate(BaseModel):
    """Schema para crear un nuevo ingrediente."""
    nombre: str
    descripcion: Optional[str] = None
    unidad_medida: str
    costo_unitario: Decimal = Decimal("0.0")

class IngredienteUpdate(BaseModel):
    """Schema para actualizar un ingrediente."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    costo_unitario: Optional[Decimal] = None

class IngredienteResponse(BaseModel):
    """Schema público de un ingrediente."""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    unidad_medida: str
    costo_unitario: Decimal
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True

class IngredienteListResponse(BaseModel):
    """Schema para lista de ingredientes."""
    ingredientes: List[IngredienteResponse]
    total: int
