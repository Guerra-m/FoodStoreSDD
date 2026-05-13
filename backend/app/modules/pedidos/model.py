"""
Modelos para el módulo de Pedidos
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, JSON, Relationship
from enum import Enum


class EstadoPedido(str, Enum):
    """Estados del pedido"""
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    PREPARANDO = "preparando"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class Pedido(SQLModel, table=True):
    """Modelo principal del pedido"""
    __tablename__ = "pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_id: int = Field(foreign_key="usuario.id", nullable=False)
    direccion_id: int = Field(foreign_key="direccion.id", nullable=False)
    
    # Snapshot de dirección (copia completa para auditoría)
    direccion_snapshot: dict = Field(default={}, sa_type=JSON)
    
    # Total del pedido en centavos
    total: int = Field(default=0, nullable=False)
    
    # Estado actual del pedido
    estado: str = Field(default=EstadoPedido.PENDIENTE.value, nullable=False)
    
    # Timestamps
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relaciones
    items: List["PedidoItem"] = Relationship(back_populates="pedido")
    historial: List["PedidoHistorial"] = Relationship(back_populates="pedido")


class PedidoItem(SQLModel, table=True):
    """Items de un pedido"""
    __tablename__ = "pedido_item"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", nullable=False)
    producto_id: int = Field(foreign_key="producto.id", nullable=False)
    
    # Snapshot del producto (nombre, precio actual) para auditoría
    producto_snapshot: dict = Field(default={}, sa_type=JSON)
    
    cantidad: int = Field(default=1, nullable=False)
    
    # Precio unitario en centavos (snapshot al momento de crear)
    precio_unitario: int = Field(default=0, nullable=False)
    
    # IDs de ingredientes excluidos por el cliente
    ingredientes_excluidos: List[int] = Field(default=[], sa_type=JSON)

    # Relación
    pedido: Pedido = Relationship(back_populates="items")


class PedidoHistorial(SQLModel, table=True):
    """Historial de cambios de estado del pedido"""
    __tablename__ = "pedido_historial"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", nullable=False)
    
    # Estado en este punto del historial
    estado: str = Field(nullable=False)
    
    # Timestamp del cambio
    timestamp: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Usuario que realizó el cambio (null si es automático del sistema)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id", nullable=True)
    
    # Descripción del cambio
    descripcion: str = Field(default="", nullable=False)

    # Relación
    pedido: Pedido = Relationship(back_populates="historial")