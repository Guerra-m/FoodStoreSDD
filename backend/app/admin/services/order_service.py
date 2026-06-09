"""
Service para gestión admin de pedidos.
Reutiliza PedidoService.transicionar_estado() para cambios de estado.
Proporciona listado con filtros y detalle completo.
"""
from datetime import datetime
from typing import Optional, List, Tuple

from sqlmodel import Session, select, func

from app.admin.schemas import (
    AdminOrderSummary,
    AdminOrderListResponse,
    AdminOrderDetail,
    AdminOrderItem,
    AdminOrderHistory,
    AdminPaymentInfo,
    UpdateOrderStatusRequest,
)
from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial
from app.modules.pedidos.service import PedidoService
from app.modules.usuarios.model import Usuario


class OrderAdminRepository:
    """Repositorio para consultas admin de pedidos."""

    def __init__(self, session: Session):
        self.session = session

    def list_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        estado: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        cliente_id: Optional[int] = None,
    ) -> Tuple[List[Pedido], int]:
        """Lista pedidos con filtros y paginación."""
        offset = (page - 1) * per_page

        query = select(Pedido)
        count_query = select(func.count(Pedido.id))

        if estado:
            query = query.where(Pedido.estado == estado)
            count_query = count_query.where(Pedido.estado == estado)

        if date_from:
            try:
                dt_from = datetime.strptime(date_from, "%Y-%m-%d")
                query = query.where(Pedido.creado_en >= dt_from)
                count_query = count_query.where(Pedido.creado_en >= dt_from)
            except ValueError:
                pass

        if date_to:
            try:
                dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(
                    hour=23, minute=59, second=59
                )
                query = query.where(Pedido.creado_en <= dt_to)
                count_query = count_query.where(Pedido.creado_en <= dt_to)
            except ValueError:
                pass

        if cliente_id:
            query = query.where(Pedido.cliente_id == cliente_id)
            count_query = count_query.where(Pedido.cliente_id == cliente_id)

        query = query.order_by(Pedido.creado_en.desc()).offset(offset).limit(per_page)
        pedidos = self.session.exec(query).all()
        total = self.session.exec(count_query).first() or 0

        return list(pedidos), total

    def get_order_with_relations(self, pedido_id: int) -> Optional[Pedido]:
        """Obtiene un pedido con items, historial y pagos."""
        stmt = select(Pedido).where(Pedido.id == pedido_id)
        pedido = self.session.exec(stmt).first()

        if not pedido:
            return None

        # Cargar items
        items_stmt = select(PedidoItem).where(PedidoItem.pedido_id == pedido_id)
        pedido.items = list(self.session.exec(items_stmt).all())

        # Cargar historial
        historial_stmt = (
            select(PedidoHistorial)
            .where(PedidoHistorial.pedido_id == pedido_id)
            .order_by(PedidoHistorial.timestamp)
        )
        pedido.historial = list(self.session.exec(historial_stmt).all())

        # Cargar pagos
        from app.modules.pagos.model import Pago

        pagos_stmt = (
            select(Pago)
            .where(Pago.pedido_id == pedido_id)
            .order_by(Pago.created_at)
        )
        pedido.pagos = list(self.session.exec(pagos_stmt).all())

        return pedido

    def get_cliente_name(self, cliente_id: int) -> str:
        """Obtiene el nombre de un cliente por ID."""
        stmt = select(Usuario.nombre).where(Usuario.id == cliente_id)
        result = self.session.exec(stmt).first()
        return result or f"Usuario #{cliente_id}"


class OrderAdminService:
    """Servicio para gestión admin de pedidos."""

    def __init__(self, session: Session):
        self.session = session
        self.repo = OrderAdminRepository(session)

    def list_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        estado: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        cliente_id: Optional[int] = None,
    ) -> AdminOrderListResponse:
        """Lista pedidos con filtros."""
        pedidos, total = self.repo.list_orders(
            page=page,
            per_page=per_page,
            estado=estado,
            date_from=date_from,
            date_to=date_to,
            cliente_id=cliente_id,
        )

        orders = []
        for p in pedidos:
            cliente_nombre = self.repo.get_cliente_name(p.cliente_id)

            # Cargar items para contar (si no están cargados)
            items_count = len(p.items) if hasattr(p, "items") and p.items else 0
            if items_count == 0 and p.id:
                items_stmt = (
                    select(func.count(PedidoItem.id))
                    .where(PedidoItem.pedido_id == p.id)
                )
                items_count = self.session.exec(items_stmt).first() or 0

            orders.append(AdminOrderSummary(
                id=p.id,
                cliente_id=p.cliente_id,
                cliente_nombre=cliente_nombre,
                total=p.total,
                estado=p.estado,
                items_count=items_count,
                creado_en=p.creado_en,
            ))

        return AdminOrderListResponse(
            orders=orders,
            total=total,
            page=page,
            per_page=per_page,
        )

    def get_order_detail(self, pedido_id: int) -> Tuple[Optional[AdminOrderDetail], Optional[str], Optional[int]]:
        """Obtiene detalle completo de un pedido."""
        pedido = self.repo.get_order_with_relations(pedido_id)
        if not pedido:
            return None, "Pedido no encontrado", 404

        cliente_nombre = self.repo.get_cliente_name(pedido.cliente_id)

        # Obtener email del cliente
        stmt = select(Usuario.email).where(Usuario.id == pedido.cliente_id)
        cliente_email = self.session.exec(stmt).first() or ""

        items = [
            AdminOrderItem(
                id=item.id,
                producto_id=item.producto_id,
                producto_nombre=item.producto_snapshot.get("nombre", f"Producto #{item.producto_id}"),
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=item.cantidad * item.precio_unitario,
            )
            for item in pedido.items
        ]

        historial = [
            AdminOrderHistory(
                id=h.id,
                estado=h.estado,
                timestamp=h.timestamp,
                usuario_id=h.usuario_id,
                descripcion=h.descripcion,
            )
            for h in pedido.historial
        ]

        pago = None
        if hasattr(pedido, "pagos") and pedido.pagos:
            latest = max(pedido.pagos, key=lambda p: p.created_at)
            pago = AdminPaymentInfo(
                mp_payment_id=latest.mp_payment_id,
                mp_status=latest.mp_status,
                status_detail=latest.status_detail,
                created_at=latest.created_at,
            )

        return AdminOrderDetail(
            id=pedido.id,
            cliente_id=pedido.cliente_id,
            cliente_nombre=cliente_nombre,
            cliente_email=cliente_email,
            total=pedido.total,
            estado=pedido.estado,
            direccion_snapshot=pedido.direccion_snapshot,
            creado_en=pedido.creado_en,
            actualizado_en=pedido.actualizado_en,
            items=items,
            historial=historial,
            pago=pago,
        ), None, None

    def update_order_status(
        self, pedido_id: int, accion: str, usuario_id: int, usuario_rol: str = "Admin"
    ) -> Tuple[Optional[AdminOrderDetail], Optional[str], Optional[int]]:
        """
        Cambia el estado de un pedido reutilizando PedidoService.transicionar_estado().

        Args:
            pedido_id: ID del pedido.
            accion: Acción FSM (pagar, preparar, enviar, entregar, cancelar).
            usuario_id: ID del admin que ejecuta la acción.
            usuario_rol: Rol del usuario para la FSM (Admin, Cocinero, etc.).

        Returns:
            (AdminOrderDetail, None, None) si exitoso.
            (None, error_msg, status_code) si falla.
        """
        pedido_service = PedidoService(self.session)
        resultado, error, status_code = pedido_service.transicionar_estado(
            pedido_id=pedido_id,
            accion=accion,
            usuario_id=usuario_id,
            usuario_rol=usuario_rol,
        )

        if error:
            return None, error, status_code or 400

        # Retornar detalle actualizado
        return self.get_order_detail(pedido_id)
