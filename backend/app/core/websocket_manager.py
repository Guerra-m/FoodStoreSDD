"""
ConnectionManager para WebSockets.

Mantiene conexiones activas por pedido_id y permite broadcast
de eventos cuando el estado de un pedido cambia.
"""
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """
    Gestiona conexiones WebSocket activas.

    - Salas por pedido_id: para tracking de clientes (existente).
    - Sala global de admins: para broadcast de TODOS los cambios de estado
      a los administradores conectados al Kanban board.
    """

    def __init__(self):
        # {pedido_id: [WebSocket, ...]} — sala por pedido (tracking cliente)
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Set global de conexiones de administradores (Kanban board)
        self.admin_connections: set[WebSocket] = set()

    # ── Salas por pedido (cliente) ──────────────────────────────

    async def connect(self, pedido_id: int, websocket: WebSocket) -> None:
        """
        Acepta una conexión WebSocket y la suscribe a un pedido.

        Args:
            pedido_id: ID del pedido a suscribirse.
            websocket: Conexión WebSocket del cliente.
        """
        await websocket.accept()
        if pedido_id not in self.active_connections:
            self.active_connections[pedido_id] = []
        self.active_connections[pedido_id].append(websocket)

    async def disconnect(self, pedido_id: int, websocket: WebSocket) -> None:
        """
        Remueve una conexión WebSocket de la lista de un pedido.

        Args:
            pedido_id: ID del pedido del que desuscribirse.
            websocket: Conexión WebSocket a remover.
        """
        connections = self.active_connections.get(pedido_id, [])
        if websocket in connections:
            connections.remove(websocket)
        # Limpiar si no quedan conexiones para ese pedido
        if not connections and pedido_id in self.active_connections:
            del self.active_connections[pedido_id]

    async def broadcast(self, pedido_id: int, data: dict) -> None:
        """
        Envía un evento JSON a TODAS las conexiones suscriptas a un pedido.

        Si una conexión falla (cliente desconectado), se remueve
        automáticamente de la lista.

        Args:
            pedido_id: ID del pedido al que broadcastear.
            data: Diccionario con los datos del evento (se serializa a JSON).
        """
        connections = self.active_connections.get(pedido_id, [])
        stale = []
        for websocket in connections:
            try:
                await websocket.send_json(data)
            except Exception:
                stale.append(websocket)

        for websocket in stale:
            connections.remove(websocket)
        if not connections and pedido_id in self.active_connections:
            del self.active_connections[pedido_id]

    def is_connected(self, pedido_id: int) -> bool:
        """
        Verifica si hay al menos una conexión activa para un pedido.
        """
        connections = self.active_connections.get(pedido_id, [])
        return len(connections) > 0

    # ── Sala global de administradores ──────────────────────────

    async def connect_admin(self, websocket: WebSocket) -> None:
        """
        Acepta y agrega una conexión WebSocket de administrador al canal global.

        Args:
            websocket: Conexión WebSocket del admin.
        """
        await websocket.accept()
        self.admin_connections.add(websocket)

    async def disconnect_admin(self, websocket: WebSocket) -> None:
        """
        Remueve una conexión WebSocket de administrador del canal global.

        Args:
            websocket: Conexión WebSocket a remover.
        """
        self.admin_connections.discard(websocket)

    async def broadcast_admin(self, data: dict) -> None:
        """
        Envía un evento JSON a TODOS los administradores conectados.

        Se usa para que el Kanban board en el panel de admin se actualice
        en tiempo real cuando cualquier pedido cambia de estado.

        Args:
            data: Diccionario con los datos del evento.
        """
        stale: list[WebSocket] = []
        for websocket in self.admin_connections:
            try:
                await websocket.send_json(data)
            except Exception:
                stale.append(websocket)

        for websocket in stale:
            self.admin_connections.discard(websocket)


# Singleton global — compartido por toda la aplicación
manager = ConnectionManager()
