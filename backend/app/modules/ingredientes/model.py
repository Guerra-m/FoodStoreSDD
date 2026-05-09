from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

class Ingrediente(SQLModel, table=True):
    """Ingrediente utilizado en la composición de productos."""
    __tablename__ = "ingrediente"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    descripcion: Optional[str] = None
    unidad_medida: str = Field(...)  # e.g., 'kg', 'g', 'ml', 'un'
    costo_unitario: Decimal = Field(default=0.0)
    
    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = None
