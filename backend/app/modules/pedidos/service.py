"""
Service para el módulo de Pedidos
Implementa Unit of Work para creación atómica de pedidos
"""
from typing import Optional, List, Tuple
from datetime import datetime

from sqlmodel import Session

from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial, EstadoPedido
from app.modules.pedidos.schema import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoItemResponse,
    PedidoHistorialResponse,
)
from app.modules.pedidos.repository import PedidoRepository


class PedidoService:
    """Servicio de pedidos con Unit of Work para atomicidad."""

    def __init__(self, session: Session):
        self.session = session
        self.repo = PedidoRepository(session)

    def crear_pedido(
        self, cliente_id: int, pedido_data: PedidoCreate
    ) -> Tuple[Optional[PedidoResponse], Optional[str]]:
        """
        Crea un pedido de forma atómica usando Unit of Work.
        
        Pasos:
        1. Validar que la dirección existe y pertenece al cliente
        2. Para cada item del carrito:
           - Validar que el producto existe y está activo
           - Validar stock con SELECT FOR UPDATE
           - Generar snapshot de precio
        3. Calcular total
        4. Crear pedido + items + historial en transacción
        5. Decrementar stock
        
        Returns:
            (PedidoResponse, None) si exitoso
            (None, error_message) si falla
        """
        # 1. Validar dirección
        direccion = self.repo.get_direccion_by_id(
            pedido_data.direccion_id, cliente_id
        )
        if not direccion:
            return None, "La dirección de entrega no es válida o no te pertenece"

        # 2. Validar cada item y preparar datos
        items_data = []
        total = 0
        productos_necesarios = []

        for item in pedido_data.items:
            # Validar producto con lock
            producto = self.repo.get_producto_for_update(item.producto_id)
            
            if not producto:
                return None, f"El producto #{item.producto_id} no existe"
            
            if not producto["is_active"]:
                return None, f"El producto '{producto['nombre']}' ya no está disponible"
            
            if producto["stock"] < item.cantidad:
                return None, (
                    f"No hay suficiente stock para '{producto['nombre']}'. "
                    f"Solicitado: {item.cantidad}, Disponible: {producto['stock']}"
                )

            # Snapshot del producto
            producto_snapshot = {
                "nombre": producto["nombre"],
                "price_in_cents": producto["price_in_cents"],
            }

            # Calcular subtotal
            subtotal = producto["price_in_cents"] * item.cantidad
            total += subtotal

            items_data.append({
                "producto_id": item.producto_id,
                "producto_snapshot": producto_snapshot,
                "cantidad": item.cantidad,
                "precio_unitario": producto["price_in_cents"],
                "ingredientes_excluidos": item.ingredientes_excluidos,
            })
            productos_necesarios.append((item.producto_id, item.cantidad))

        try:
            # 3. Crear pedido
            pedido = Pedido(
                cliente_id=cliente_id,
                direccion_id=pedido_data.direccion_id,
                direccion_snapshot=direccion,
                total=total,
                estado=EstadoPedido.PENDIENTE.value,
            )

            # 4. Crear items
            items = [
                PedidoItem(
                    producto_id=data["producto_id"],
                    producto_snapshot=data["producto_snapshot"],
                    cantidad=data["cantidad"],
                    precio_unitario=data["precio_unitario"],
                    ingredientes_excluidos=data["ingredientes_excluidos"],
                )
                for data in items_data
            ]

            # 5. Crear entrada de historial inicial
            historial_entry = PedidoHistorial(
                estado=EstadoPedido.PENDIENTE.value,
                timestamp=datetime.utcnow(),
                usuario_id=None,  # Sistema
                descripcion="Pedido creado",
            )

            # 6. Crear todo en una transacción
            self.repo.create_with_items(pedido, items, historial_entry)

            # 7. Decrementar stock después de crear el pedido
            for producto_id, cantidad in productos_necesarios:
                success = self.repo.decrement_stock(producto_id, cantidad)
                if not success:
                    # Esto no debería pasar porque validamos antes,
                    # pero por seguridad hacemos rollback
                    raise Exception(f"Error al decrementar stock del producto #{producto_id}")

            # Commit final
            self.session.commit()

            # Obtener el pedido con todas las relaciones
            pedido_completo = self.repo.get_by_id_with_relations(pedido.id)
            
            return self._to_response(pedido_completo), None

        except Exception as e:
            self.session.rollback()
            return None, f"Error al crear el pedido: {str(e)}"

    def listar_por_cliente(
        self, cliente_id: int, page: int = 1, per_page: int = 20
    ) -> PedidoListResponse:
        """Lista los pedidos de un cliente con paginación."""
        pedidos, total = self.repo.get_by_cliente(cliente_id, page, per_page)
        
        # Cargar relaciones para cada pedido
        pedidos_response = []
        for pedido in pedidos:
            pedido_con_items = self.repo.get_by_id_with_relations(pedido.id)
            pedidos_response.append(self._to_response(pedido_con_items))
        
        return PedidoListResponse(
            pedidos=pedidos_response,
            total=total,
            page=page,
            per_page=per_page,
        )

    def obtener_por_id(self, pedido_id: int, cliente_id: int) -> Tuple[Optional[PedidoResponse], Optional[str]]:
        """Obtiene un pedido por ID verificando que pertenezca al cliente."""
        pedido = self.repo.get_by_id_with_relations(pedido_id)
        
        if not pedido:
            return None, "Pedido no encontrado"
        
        if pedido.cliente_id != cliente_id:
            return None, "Pedido no encontrado"  # 404, no revelar existencia
        
        return self._to_response(pedido), None

    def obtener_historial(self, pedido_id: int, cliente_id: int) -> Tuple[Optional[List[PedidoHistorialResponse]], Optional[str]]:
        """Obtiene el historial de un pedido."""
        pedido = self.repo.get_by_id(pedido_id)
        
        if not pedido:
            return None, "Pedido no encontrado"
        
        if pedido.cliente_id != cliente_id:
            return None, "Pedido no encontrado"
        
        historial = self.repo.get_historial_by_pedido(pedido_id)
        
        return [
            PedidoHistorialResponse(
                id=h.id,
                estado=h.estado,
                timestamp=h.timestamp,
                usuario_id=h.usuario_id,
                descripcion=h.descripcion,
            )
            for h in historial
        ], None

    def _to_response(self, pedido: Pedido) -> PedidoResponse:
        """Convierte un modelo Pedido a PedidoResponse."""
        items_response = [
            PedidoItemResponse(
                id=item.id,
                producto_id=item.producto_id,
                producto_snapshot=item.producto_snapshot,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                ingredientes_excluidos=item.ingredientes_excluidos,
            )
            for item in pedido.items
        ]

        historial_response = [
            PedidoHistorialResponse(
                id=h.id,
                estado=h.estado,
                timestamp=h.timestamp,
                usuario_id=h.usuario_id,
                descripcion=h.descripcion,
            )
            for h in getattr(pedido, 'historial', [])
        ]

        return PedidoResponse(
            id=pedido.id,
            cliente_id=pedido.cliente_id,
            direccion_id=pedido.direccion_id,
            direccion_snapshot=pedido.direccion_snapshot,
            total=pedido.total,
            estado=pedido.estado,
            creado_en=pedido.creado_en,
            actualizado_en=pedido.actualizado_en,
            items=items_response,
            historial=historial_response,
        )