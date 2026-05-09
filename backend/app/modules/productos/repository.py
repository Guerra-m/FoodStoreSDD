from typing import Optional, List

from sqlmodel import Session, select, func, or_

from app.modules.productos.model import Producto, ProductoCategoria, ProductoIngrediente


class ProductoRepository:
    """Repositorio para operaciones de Producto."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, producto: Producto) -> Producto:
        """Crea un nuevo producto."""
        self.session.add(producto)
        self.session.commit()
        self.session.refresh(producto)
        return producto

    def get_by_id(self, producto_id: int) -> Optional[Producto]:
        """Obtiene un producto por ID (incluye inactivos)."""
        statement = select(Producto).where(
            Producto.id == producto_id,
            Producto.eliminado_en == None,
        )
        return self.session.exec(statement).first()

    def get_all_admin(self, page: int = 1, per_page: int = 20) -> tuple[list[Producto], int]:
        """Obtiene todos los productos (admin, incluye inactivos) con paginación."""
        offset = (page - 1) * per_page
        statement = select(Producto).where(
            Producto.eliminado_en == None,
        ).order_by(Producto.nombre).offset(offset).limit(per_page)
        productos = self.session.exec(statement).all()

        count_stmt = select(func.count(Producto.id)).where(
            Producto.eliminado_en == None,
        )
        total = self.session.exec(count_stmt).first()

        return list(productos), total or 0

    def get_public(
        self,
        categoria_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Producto], int]:
        """Obtiene productos activos con filtros para el catálogo público."""
        offset = (page - 1) * per_page

        # Construir query base
        query = select(Producto).where(
            Producto.is_active == True,
            Producto.eliminado_en == None,
        )

        # Filtro por categoría
        if categoria_id is not None:
            query = query.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            )

        # Filtro por búsqueda de nombre
        if search:
            query = query.where(
                func.lower(Producto.nombre).contains(search.lower())
            )

        # Filtro por rango de precio
        if min_price is not None:
            query = query.where(Producto.price_in_cents >= min_price)
        if max_price is not None:
            query = query.where(Producto.price_in_cents <= max_price)

        # Obtener total antes de paginación
        count_query = select(func.count()).select_from(query.subquery())
        total = self.session.exec(count_query).first() or 0

        # Aplicar paginación
        query = query.order_by(Producto.nombre).offset(offset).limit(per_page)
        productos = self.session.exec(query).all()

        return list(productos), total

    def count_by_categoria(self, categoria_id: int) -> int:
        """Cuenta productos activos asociados a una categoría."""
        statement = select(func.count(Producto.id)).where(
            Producto.is_active == True,
            Producto.eliminado_en == None,
            Producto.id.in_(
                select(ProductoCategoria.producto_id).where(
                    ProductoCategoria.categoria_id == categoria_id
                )
            ),
        )
        result = self.session.exec(statement).first()
        return result or 0

    def count_by_ingrediente(self, ingrediente_id: int) -> int:
        """Cuenta productos activos que usan un ingrediente."""
        statement = select(func.count(Producto.id)).where(
            Producto.is_active == True,
            Producto.eliminado_en == None,
            Producto.id.in_(
                select(ProductoIngrediente.producto_id).where(
                    ProductoIngrediente.ingrediente_id == ingrediente_id
                )
            ),
        )
        result = self.session.exec(statement).first()
        return result or 0

    def update(self, producto: Producto) -> Producto:
        """Actualiza un producto."""
        self.session.add(producto)
        self.session.commit()
        self.session.refresh(producto)
        return producto

    def delete(self, producto: Producto) -> None:
        """Soft delete de un producto."""
        from datetime import datetime, timezone
        producto.eliminado_en = datetime.now(timezone.utc)
        self.session.add(producto)
        self.session.commit()
