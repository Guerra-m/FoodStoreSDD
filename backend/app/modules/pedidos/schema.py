"""
Schemas para el módulo de Pedidos
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PedidoItemCreate(BaseModel):
    """Schema para crear un item del pedido desde el carrito"""
    producto_id: int
    cantidad: int
    ingredientes_excluidos: List[int] = []


class PedidoCreate(BaseModel):
    """Schema para crear un nuevo pedido"""
    items: List[PedidoItemCreate]
    direccion_id: int


class PedidoItemResponse(BaseModel):
    """Schema de respuesta para un item del pedido"""
    id: int
    producto_id: int
    producto_snapshot: dict
    cantidad: int
    precio_unitario: int
    ingredientes_excluidos: List[int]
    
    class Config:
        from_attributes = True


class PedidoHistorialResponse(BaseModel):
    """Schema de respuesta para una entrada del historial"""
    id: int
    estado: str
    timestamp: datetime
    usuario_id: Optional[int]
    descripcion: str
    
    class Config:
        from_attributes = True


class PedidoResponse(BaseModel):
    """Schema de respuesta completo de un pedido"""
    id: int
    cliente_id: int
    direccion_id: int
    direccion_snapshot: dict
    total: int
    estado: str
    creado_en: datetime
    actualizado_en: datetime
    items: List[PedidoItemResponse]
    historial: List[PedidoHistorialResponse]
    payment_status: Optional[str] = None
    
    class Config:
        from_attributes = True


class PedidoListResponse(BaseModel):
    """Schema para lista de pedidos con paginación"""
    pedidos: List[PedidoResponse]
    total: int
    page: int
    per_page: int


class TransicionRequest(BaseModel):
    """Schema para solicitar una transición de estado en un pedido"""
    accion: str