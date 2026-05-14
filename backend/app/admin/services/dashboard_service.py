"""
Service para métricas del dashboard.
Orquesta las consultas del repositorio y las transforma a schemas.
"""
from typing import Optional

from sqlmodel import Session

from app.admin.schemas import (
    DashboardStats,
    OrdersByStatus,
    OrdersByStatusResponse,
    RevenueResponse,
    RevenuePoint,
    TopProductsResponse,
    TopProduct,
)
from app.admin.repositories.dashboard_repo import DashboardRepository


class DashboardService:
    """Servicio que orquesta las métricas del dashboard."""

    def __init__(self, session: Session):
        self.repo = DashboardRepository(session)

    def get_stats(self) -> DashboardStats:
        """Retorna todas las métricas globales."""
        total_users = self.repo.get_total_users()
        total_orders = self.repo.get_total_orders()
        total_revenue = self.repo.get_total_revenue()
        orders_by_status_raw = self.repo.get_orders_by_status()

        orders_by_status = [
            OrdersByStatus(estado=estado, cantidad=cantidad)
            for estado, cantidad in orders_by_status_raw
        ]

        return DashboardStats(
            total_users=total_users,
            total_orders=total_orders,
            total_revenue=total_revenue,
            orders_by_status=orders_by_status,
        )

    def get_revenue(self, period: str = "daily") -> Optional[RevenueResponse]:
        """
        Retorna ingresos en el tiempo según el período.

        Args:
            period: "daily" (30 días) o "monthly" (12 meses).

        Returns:
            RevenueResponse o None si el período es inválido.
        """
        if period == "daily":
            raw = self.repo.get_daily_revenue(days=30)
            data = [
                RevenuePoint(fecha=fecha, ingreso_total=ingreso)
                for fecha, ingreso in raw
            ]
            return RevenueResponse(period="daily", data=data)

        elif period == "monthly":
            raw = self.repo.get_monthly_revenue(months=12)
            data = [
                RevenuePoint(fecha=fecha, ingreso_total=ingreso)
                for fecha, ingreso in raw
            ]
            return RevenueResponse(period="monthly", data=data)

        return None

    def get_top_products(self) -> TopProductsResponse:
        """Retorna los productos más vendidos."""
        raw = self.repo.get_top_products(limit=10)
        data = [
            TopProduct(
                id=pid,
                nombre=nombre,
                cantidad_vendida=cantidad,
                ingreso_total=ingreso,
            )
            for pid, nombre, cantidad, ingreso in raw
        ]
        return TopProductsResponse(data=data)

    def get_orders_by_status(self) -> OrdersByStatusResponse:
        """Retorna la distribución de pedidos por estado."""
        raw = self.repo.get_orders_by_status()
        data = [
            OrdersByStatus(estado=estado, cantidad=cantidad)
            for estado, cantidad in raw
        ]
        return OrdersByStatusResponse(data=data)
