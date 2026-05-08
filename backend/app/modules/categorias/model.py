from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List


class Categoria(SQLModel, table=True):
    """Categoría de productos con soporte jerárquico (árbol)."""
    __tablename__ = "categoria"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    # Foreign key auto-referencial para jerarquía padre-hijo
    padre_id: Optional[int] = Field(default=None, foreign_key="categoria.id", nullable=True)
    # Posición para ordenamiento dentro del mismo nivel
    posicion: int = Field(default=0)
    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    # Soft delete
    eliminado_en: Optional[datetime] = None

    # Relación self-referential para hijos
    hijos: List["Categoria"] = Relationship(
        sa_relationship_kwargs={
            "remote_side": "[Categoria.id]",
            "lazy": "selectin",
        }
    )