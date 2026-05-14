"""
Repository para métricas del dashboard.
Ejecuta queries agregadas sobre las tablas existentes.
"""
from datetime import datetime, timedelta
from typing import List, Tuple

from sqlmodel import Session, select, func, text

from app.modules.usuarios.model import Usuario
from app.modules.pedidos.model import Pedido, PedidoItem, EstadoPedido


class DashboardRepository:
    """Repositorio para consultas agregadas del dashboard."""

    def __init__(self, session: Session):
        self.session = session

    def get_total_users(self) -> int:
        """Retorna el total de usuarios no eliminados."""
        stmt = select(func.count(Usuario.id)).where(Usuario.eliminado_en.is_(None))
        result = self.session.exec(stmt).first()
        return result or 0

    def get_total_orders(self) -> int:
        """Retorna el total de pedidos."""
        stmt = select(func.count(Pedido.id))
        result = self.session.exec(stmt).first()
        return result or 0

    def get_total_revenue(self) -> int:
        """
        Retorna la suma de totales de pedidos en estados
        que representan ingresos confirmados (pagado, entregado).
        """
        stmt = (
            select(func.coalesce(func.sum(Pedido.total), 0))
            .where(Pedido.estado.in_([
                EstadoPedido.PAGADO.value,
                EstadoPedido.ENTREGADO.value,
            ]))
        )
        result = self.session.exec(stmt).first()
        return result or 0

    def get_orders_by_status(self) -> List[Tuple[str, int]]:
        """Retorna conteo de pedidos agrupados por estado."""
        stmt = (
            select(Pedido.estado, func.count(Pedido.id))
            .group_by(Pedido.estado)
            .order_by(Pedido.estado)
        )
        results = self.session.exec(stmt).all()
        return [(row[0], row[1]) for row in results]

    def get_daily_revenue(self, days: int = 30) -> List[Tuple[str, int]]:
        """
        Retorna ingresos diarios para los últimos N días.
        Considera solo pedidos pagados o entregados.
        """
        since = datetime.utcnow() - timedelta(days=days)
        stmt = (
            select(
                func.date(Pedido.actualizado_en).label("fecha"),
                func.coalesce(func.sum(Pedido.total), 0).label("ingreso"),
            )
            .where(
                Pedido.actualizado_en >= since,
                Pedido.estado.in_([
                    EstadoPedido.PAGADO.value,
                    EstadoPedido.ENTREGADO.value,
                ]),
            )
            .group_by(text("fecha"))
            .order_by(text("fecha"))
        )
        results = self.session.exec(stmt).all()
        return [(row[0], row[1]) for row in results]

    def get_monthly_revenue(self, months: int = 12) -> List[Tuple[str, int]]:
        """
        Retorna ingresos mensuales para los últimos N meses.
        """
        since = datetime.utcnow() - timedelta(days=months * 30)
        stmt = (
            select(
                func.strftime("%Y-%m", Pedido.actualizado_en).label("mes"),
                func.coalesce(func.sum(Pedido.total), 0).label("ingreso"),
            )
            .where(
                Pedido.actualizado_en >= since,
                Pedido.estado.in_([
                    EstadoPedido.PAGADO.value,
                    EstadoPedido.ENTREGADO.value,
                ]),
            )
            .group_by(text("mes"))
            .order_by(text("mes"))
        )
        results = self.session.exec(stmt).all()
        return [(row[0], row[1]) for row in results]

    def get_top_products(self, limit: int = 10) -> List[Tuple[int, str, int, int]]:
        """
        Retorna los productos más vendidos por cantidad.
        Considera items de pedidos pagados o entregados.
        Extrae el nombre del producto desde el snapshot JSON.
        """
        stmt = (
            select(
                PedidoItem.producto_id,
                func.sum(PedidoItem.cantidad).label("cantidad"),
                func.sum(
                    PedidoItem.cantidad * PedidoItem.precio_unitario
                ).label("ingreso"),
            )
            .join(Pedido, PedidoItem.pedido_id == Pedido.id)
            .where(
                Pedido.estado.in_([
                    EstadoPedido.PAGADO.value,
                    EstadoPedido.ENTREGADO.value,
                ])
            )
            .group_by(PedidoItem.producto_id)
            .order_by(text("cantidad DESC"))
            .limit(limit)
        )
        results = self.session.exec(stmt).all()

        # Extraer nombres desde los snapshots (el primer snapshot disponible da el nombre)
        output = []
        for row in results:
            producto_id = row[0]
            cantidad = row[1]
            ingreso = row[2]

            # Obtener nombre desde el snapshot del primer item de este producto
            nombre_stmt = (
                select(PedidoItem.producto_snapshot)
                .where(PedidoItem.producto_id == producto_id)
                .limit(1)
            )
            snapshot = self.session.exec(nombre_stmt).first()
            nombre = snapshot.get("nombre", f"Producto #{producto_id}") if snapshot else f"Producto #{producto_id}"

            output.append((producto_id, nombre, cantidad, ingreso))

        return output
