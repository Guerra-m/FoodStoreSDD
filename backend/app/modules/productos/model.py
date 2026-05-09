from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class ProductoCategoria(SQLModel, table=True):
    """Tabla asociativa para relación many-to-many entre Producto y Categoria."""
    __tablename__ = "producto_categorias"
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)


class ProductoIngrediente(SQLModel, table=True):
    """Tabla asociativa para relación many-to-many entre Producto e Ingrediente con cantidad."""
    __tablename__ = "producto_ingredientes"
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)
    cantidad: Decimal = Field(default=Decimal("0.0"))


class Producto(SQLModel, table=True):
    """Producto del catálogo de FoodStore."""
    __tablename__ = "producto"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    descripcion: Optional[str] = None
    price_in_cents: int = Field(default=0)
    images: List[str] = Field(default=[], sa_column=Column(JSON))
    stock: int = Field(default=0)
    is_active: bool = Field(default=True)

    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = None

    # Relaciones
    categorias: List["Categoria"] = Relationship(
        link_model=ProductoCategoria,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    ingredientes: List["ProductoIngrediente"] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"},
    )
