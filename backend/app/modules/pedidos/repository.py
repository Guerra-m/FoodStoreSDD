"""
Repository para el módulo de Pedidos
"""
from typing import Optional, List, Tuple
from datetime import datetime

from sqlmodel import Session, select, func

from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial


class PedidoRepository:
    """Repositorio para operaciones de Pedido."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, pedido_id: int) -> Optional[Pedido]:
        """Obtiene un pedido por ID con sus relaciones."""
        statement = select(Pedido).where(Pedido.id == pedido_id)
        return self.session.exec(statement).first()

    def get_by_id_with_relations(self, pedido_id: int) -> Optional[Pedido]:
        """Obtiene un pedido por ID con items, historial y pagos."""
        statement = select(Pedido).where(Pedido.id == pedido_id)
        pedido = self.session.exec(statement).first()
        
        if pedido:
            # Cargar items
            items_stmt = select(PedidoItem).where(PedidoItem.pedido_id == pedido_id)
            pedido.items = list(self.session.exec(items_stmt).all())
            
            # Cargar historial
            historial_stmt = select(PedidoHistorial).where(
                PedidoHistorial.pedido_id == pedido_id
            ).order_by(PedidoHistorial.timestamp)
            pedido.historial = list(self.session.exec(historial_stmt).all())
            
            # Cargar pagos
            from app.modules.pagos.model import Pago
            pagos_stmt = select(Pago).where(Pago.pedido_id == pedido_id).order_by(Pago.created_at)
            pedido.pagos = list(self.session.exec(pagos_stmt).all())
        
        return pedido

    def get_by_cliente(
        self, cliente_id: int, page: int = 1, per_page: int = 20
    ) -> Tuple[List[Pedido], int]:
        """Obtiene pedidos de un cliente con paginación."""
        offset = (page - 1) * per_page
        
        statement = (
            select(Pedido)
            .where(Pedido.cliente_id == cliente_id)
            .order_by(Pedido.creado_en.desc())
            .offset(offset)
            .limit(per_page)
        )
        pedidos = self.session.exec(statement).all()

        count_stmt = select(func.count(Pedido.id)).where(Pedido.cliente_id == cliente_id)
        total = self.session.exec(count_stmt).first()

        return list(pedidos), total or 0

    def create(self, pedido: Pedido) -> Pedido:
        """Crea un nuevo pedido."""
        self.session.add(pedido)
        self.session.commit()
        self.session.refresh(pedido)
        return pedido

    def create_with_items(
        self,
        pedido: Pedido,
        items: List[PedidoItem],
        historial_entry: PedidoHistorial,
    ) -> Pedido:
        """
        Crea pedido + items + historial en una transacción.
        Para uso con UoW.
        """
        # Agregar pedido
        self.session.add(pedido)
        
        # Flush para obtener el ID del pedido
        self.session.flush()
        
        # Agregar items con el pedido_id asignado
        for item in items:
            item.pedido_id = pedido.id
            self.session.add(item)
        
        # Agregar historial
        historial_entry.pedido_id = pedido.id
        self.session.add(historial_entry)
        
        # Commit de todo junto
        self.session.commit()
        self.session.refresh(pedido)
        
        return pedido

    def get_historial_by_pedido(self, pedido_id: int) -> List[PedidoHistorial]:
        """Obtiene el historial de un pedido."""
        statement = select(PedidoHistorial).where(
            PedidoHistorial.pedido_id == pedido_id
        ).order_by(PedidoHistorial.timestamp)
        return list(self.session.exec(statement).all())

    def add_historial_entry(self, entry: PedidoHistorial) -> PedidoHistorial:
        """Agrega una entrada al historial."""
        self.session.add(entry)
        self.session.commit()
        self.session.refresh(entry)
        return entry

    def get_producto_for_update(self, producto_id: int) -> Optional[dict]:
        """
        Obtiene un producto con lock para actualización de stock.
        Retorna un dict con los datos del producto.
        """
        # Import aquí para evitar circular import
        from app.modules.productos.model import Producto
        
        statement = (
            select(Producto)
            .where(Producto.id == producto_id)
            .with_for_update()
        )
        producto = self.session.exec(statement).first()
        
        if producto:
            return {
                "id": producto.id,
                "nombre": producto.nombre,
                "price_in_cents": producto.price_in_cents,
                "stock": producto.stock,
                "is_active": producto.is_active,
            }
        return None

    def decrement_stock(self, producto_id: int, cantidad: int) -> bool:
        """
        Decrementa el stock de un producto.
        Retorna True si fue exitoso, False si no hay stock suficiente.
        """
        from app.modules.productos.model import Producto
        
        producto = self.session.get(Producto, producto_id)
        if not producto:
            return False
        
        if producto.stock < cantidad:
            return False
        
        producto.stock -= cantidad
        self.session.add(producto)
        self.session.flush()
        
        return True

    def restore_stock(self, producto_id: int, cantidad: int) -> None:
        """Restaura el stock (para rollback)."""
        from app.modules.productos.model import Producto
        
        producto = self.session.get(Producto, producto_id)
        if producto:
            producto.stock += cantidad
            self.session.add(producto)
            self.session.flush()

    def get_direccion_by_id(self, direccion_id: int, cliente_id: int) -> Optional[dict]:
        """Obtiene una dirección verificando que pertenezca al cliente."""
        from app.modules.direcciones.model import Direccion
        
        statement = select(Direccion).where(
            Direccion.id == direccion_id,
            Direccion.usuario_id == cliente_id,
        )
        direccion = self.session.exec(statement).first()
        
        if direccion:
            return {
                "id": direccion.id,
                "calle": direccion.calle,
                "numero": direccion.numero,
                "ciudad": direccion.ciudad,
                "provincia": direccion.provincia,
                "codigo_postal": direccion.codigo_postal,
            }
        return None