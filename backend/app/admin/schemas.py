"""
Schemas para los endpoints de administración.
Define las respuestas para dashboard, gestión de usuarios y pedidos.
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Métricas globales del dashboard."""
    total_users: int = 0
    total_orders: int = 0
    total_revenue: int = 0  # en centavos
    orders_by_status: List["OrdersByStatus"] = []


class OrdersByStatus(BaseModel):
    """Conteo de pedidos agrupados por estado."""
    estado: str
    cantidad: int


class RevenuePoint(BaseModel):
    """Punto de ingreso para gráficos en el tiempo."""
    fecha: str  # Formato ISO (YYYY-MM-DD o YYYY-MM)
    ingreso_total: int  # en centavos


class RevenueResponse(BaseModel):
    """Respuesta del endpoint de ingresos en el tiempo."""
    period: str  # "daily" o "monthly"
    data: List[RevenuePoint] = []


class TopProduct(BaseModel):
    """Producto con métricas de venta."""
    id: int
    nombre: str
    cantidad_vendida: int
    ingreso_total: int  # en centavos


class TopProductsResponse(BaseModel):
    """Respuesta del top de productos más vendidos."""
    data: List[TopProduct] = []


class OrdersByStatusResponse(BaseModel):
    """Respuesta de distribución de pedidos por estado."""
    data: List[OrdersByStatus] = []


# ─── User Management ──────────────────────────────────────────────────────────

class UserAdminResponse(BaseModel):
    """Respuesta completa de un usuario para el admin."""
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None
    roles: List[str] = []
    creado_en: datetime
    eliminado_en: Optional[datetime] = None


class UserAdminListResponse(BaseModel):
    """Lista paginada de usuarios para admin."""
    users: List[UserAdminResponse] = []
    total: int
    page: int
    per_page: int


class UpdateRolesRequest(BaseModel):
    """Request para actualizar roles de un usuario."""
    roles: List[str]


# ─── Order Management ─────────────────────────────────────────────────────────

class AdminOrderItem(BaseModel):
    """Item de un pedido en vista admin."""
    id: int
    producto_id: int
    producto_nombre: str
    cantidad: int
    precio_unitario: int
    subtotal: int


class AdminOrderHistory(BaseModel):
    """Entrada de historial en vista admin."""
    id: int
    estado: str
    timestamp: datetime
    usuario_id: Optional[int] = None
    descripcion: str


class AdminPaymentInfo(BaseModel):
    """Información de pago en vista admin."""
    mp_payment_id: Optional[int] = None
    mp_status: str
    status_detail: Optional[str] = None
    created_at: datetime


class AdminOrderDetail(BaseModel):
    """Detalle completo de un pedido para admin."""
    id: int
    cliente_id: int
    cliente_nombre: str
    cliente_email: str
    total: int
    estado: str
    direccion_snapshot: dict = {}
    creado_en: datetime
    actualizado_en: datetime
    items: List[AdminOrderItem] = []
    historial: List[AdminOrderHistory] = []
    pago: Optional[AdminPaymentInfo] = None


class AdminOrderSummary(BaseModel):
    """Resumen de un pedido para listado admin."""
    id: int
    cliente_id: int
    cliente_nombre: str
    total: int
    estado: str
    items_count: int
    creado_en: datetime


class AdminOrderListResponse(BaseModel):
    """Lista paginada de pedidos para admin."""
    orders: List[AdminOrderSummary] = []
    total: int
    page: int
    per_page: int


class UpdateOrderStatusRequest(BaseModel):
    """Request para cambiar estado de un pedido."""
    accion: str  # acción FSM: pagar, preparar, enviar, entregar, cancelar
