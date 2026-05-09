from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel


class ProductoIngredienteCreate(BaseModel):
    """Schema para asociar un ingrediente a un producto con cantidad."""
    ingrediente_id: int
    cantidad: Decimal = Decimal("0.0")


class ProductoCreate(BaseModel):
    """Schema para crear un nuevo producto."""
    nombre: str
    descripcion: Optional[str] = None
    price_in_cents: int
    images: List[str] = []
    stock: int = 0
    is_active: bool = True
    categoria_ids: List[int] = []
    ingredientes: List[ProductoIngredienteCreate] = []


class ProductoIngredienteUpdate(BaseModel):
    """Schema para actualizar un ingrediente asociado."""
    ingrediente_id: int
    cantidad: Optional[Decimal] = None


class ProductoUpdate(BaseModel):
    """Schema para actualizar un producto."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    price_in_cents: Optional[int] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    categoria_ids: Optional[List[int]] = None
    ingredientes: Optional[List[ProductoIngredienteUpdate]] = None


class StockUpdate(BaseModel):
    """Schema para actualizar stock (set, increment, decrement)."""
    action: str = "set"  # "set", "increment", "decrement"
    value: int


class ProductoIngredienteResponse(BaseModel):
    """Schema público de ingrediente en un producto."""
    ingrediente_id: int
    nombre: str
    cantidad: Decimal
    unidad_medida: str

    class Config:
        from_attributes = True


class ProductoResponse(BaseModel):
    """Schema completo de un producto (admin)."""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    price_in_cents: int
    images: List[str] = []
    stock: int
    is_active: bool
    categoria_ids: List[int] = []
    ingredientes: List[ProductoIngredienteResponse] = []
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class ProductoPublicResponse(BaseModel):
    """Schema público de un producto (catálogo)."""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    price_in_cents: int
    images: List[str] = []
    categoria_ids: List[int] = []
    ingredientes: List[ProductoIngredienteResponse] = []

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    """Schema para lista de productos."""
    productos: List[ProductoResponse]
    total: int


class ProductoPublicListResponse(BaseModel):
    """Schema para lista pública de productos."""
    productos: List[ProductoPublicResponse]
    total: int
    page: int
    per_page: int
