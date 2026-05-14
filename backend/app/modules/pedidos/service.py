"""
Service para el módulo de Pedidos
Implementa Unit of Work para creación atómica de pedidos
y FSM para transiciones de estado.
"""
from typing import Optional, List, Tuple
from datetime import datetime

from sqlmodel import Session, select

from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial, EstadoPedido
from app.modules.pedidos.schema import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    PedidoItemResponse,
    PedidoHistorialResponse,
)
from app.modules.pedidos.repository import PedidoRepository
from app.modules.pedidos.fsm import OrderFSM


class PedidoService:
    """Servicio de pedidos con Unit of Work para atomicidad y FSM para transiciones."""

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

    def transicionar_estado(
        self, pedido_id: int, accion: str, usuario_id: int, usuario_rol: str
    ) -> Tuple[Optional[PedidoResponse], Optional[str], Optional[int]]:
        """
        Transiciona un pedido a un nuevo estado usando la FSM.

        Valida que la transición sea permitida según el estado actual,
        que el usuario tenga el rol adecuado, y que el pedido exista
        (y pertenezca al cliente si es cliente quien solicita).

        Args:
            pedido_id: ID del pedido a transicionar.
            accion: Acción a ejecutar (pagar, preparar, enviar, entregar, cancelar).
            usuario_id: ID del usuario que solicita la transición.
            usuario_rol: Rol del usuario ("Cliente", "Admin", "Sistema").

        Returns:
            (PedidoResponse, None, None) si exitoso.
            (None, mensaje_error, status_code) si falla.
        """
        # 1. Validar que la acción existe en el sistema
        if not OrderFSM.is_action_valid(accion):
            return None, (
                f"Acción no válida: '{accion}'. "
                f"Acciones permitidas: {', '.join(OrderFSM.VALID_ACTIONS)}"
            ), 400

        # 2. Obtener pedido con lock pesimista (SELECT FOR UPDATE)
        statement = select(Pedido).where(Pedido.id == pedido_id).with_for_update()
        pedido = self.session.exec(statement).first()

        if not pedido:
            return None, "Pedido no encontrado", 404

        # 3. Si es cliente, verificar que el pedido le pertenezca
        if usuario_rol == "Cliente" and pedido.cliente_id != usuario_id:
            return None, "Pedido no encontrado", 404

        # 4. Validar que el estado actual no sea terminal
        if OrderFSM.is_terminal_state(pedido.estado):
            return None, (
                f"El pedido se encuentra en un estado terminal "
                f"('{pedido.estado}') y no admite más transiciones"
            ), 400

        # 5. Validar que la transición esté permitida desde el estado actual
        if not OrderFSM.can_transition(pedido.estado, accion):
            return None, (
                f"La acción '{accion}' no está permitida desde "
                f"el estado '{pedido.estado}'"
            ), 400

        # 6. Validar que el rol del usuario tenga permiso para esta transición
        allowed_actions = OrderFSM.get_allowed_actions(pedido.estado, usuario_rol)
        if accion not in allowed_actions:
            return None, (
                f"No tienes permisos para ejecutar '{accion}' "
                f"desde el estado '{pedido.estado}'"
            ), 403

        try:
            # 7. Obtener estado destino
            nuevo_estado = OrderFSM.get_next_state(pedido.estado, accion)

            # 8. Si es cancelación, restaurar stock primero
            if accion == "cancelar":
                for item in pedido.items:
                    self.repo.restore_stock(item.producto_id, item.cantidad)

            # 9. Actualizar estado del pedido
            pedido.estado = nuevo_estado
            pedido.actualizado_en = datetime.utcnow()

            # 10. Registrar en historial
            descripcion = OrderFSM.get_description_for_action(accion, pedido.estado)
            historial_entry = PedidoHistorial(
                pedido_id=pedido.id,
                estado=nuevo_estado,
                timestamp=datetime.utcnow(),
                usuario_id=usuario_id if usuario_rol != "Sistema" else None,
                descripcion=descripcion,
            )
            self.session.add(historial_entry)

            # 11. Commit
            self.session.commit()
            self.session.refresh(pedido)

            # 12. Retornar pedido actualizado con relaciones
            pedido_completo = self.repo.get_by_id_with_relations(pedido.id)
            return self._to_response(pedido_completo), None, None

        except Exception as e:
            self.session.rollback()
            return None, f"Error al transicionar el pedido: {str(e)}", 500

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

        # Obtener payment_status del último Pago asociado (si cargado)
        payment_status = None
        if hasattr(pedido, 'pagos') and pedido.pagos:
            latest_pago = max(pedido.pagos, key=lambda p: p.created_at)
            payment_status = latest_pago.mp_status

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
            payment_status=payment_status,
        )