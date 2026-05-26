# Design: Order Tracking Realtime

## Arquitectura General

```
Frontend (React)                     Backend (FastAPI)
─────────────────                    ────────────────

┌──────────────────┐     REST        ┌──────────────────────┐
│   MisPedidos.tsx  │ ◄── GET ────── │  GET /api/v1/pedidos │
│  (polling 30s)    │                └──────────────────────┘
└────────┬─────────┘
         │
         │ WebSocket (JWT token)
         ▼
┌──────────────────┐     WS         ┌──────────────────────┐
│ OrderTrackingDash│ ◄───────────── │  WS /api/v1/ws/      │
│  .tsx            │    evento      │    pedidos/{id}      │
│                  │                └──────────┬───────────┘
└──────────────────┘                           │
                                               │ broadcast
                                               ▼
                                        ┌──────────────────┐
                                        │ POST /transicion │
                                        │  (Admin/Sistema) │
                                        └──────────────────┘
```

## Backend

### 1. ConnectionManager (singleton en memoria)

```
app/core/websocket_manager.py
```

Maneja conexiones activas por `pedido_id`. Como usamos SQLite (sin Redis), los connections se guardan en un dict en memoria.

```python
class ConnectionManager:
    # {pedido_id: [WebSocket, ...]}
    active_connections: dict[int, list[WebSocket]]
    
    async def connect(pedido_id, websocket)    # Agrega WS a la lista
    async def disconnect(pedido_id, websocket)  # Remueve WS
    async def broadcast(pedido_id, data)        # Envía a TODOS los WS suscriptos
```

### 2. WebSocket Endpoint

```
WS /api/v1/ws/pedidos/{pedido_id}?token={jwt}
```

- Auth vía `token` query param (los browsers no permiten custom headers en WS handshake)
- Verifica que el pedido exista y pertenezca al cliente autenticado
- Suscribe el socket al `pedido_id`
- Maneja disconnect graceful

### 3. Disparo de eventos

Cuando `POST /api/v1/pedidos/{pedido_id}/transicion` se ejecuta exitosamente en `PedidoService.transicionar_estado()`, se llama a:

```python
await connection_manager.broadcast(
    pedido_id=pedido_id,
    data={
        "type": "estado_actualizado",
        "pedido_id": pedido.id,
        "estado_anterior": "...",
        "estado_nuevo": pedido.estado,
        "descripcion": OrderFSM.get_description_for_action(accion, pedido.estado),
        "timestamp": datetime.utcnow().isoformat(),
        "historial": [...]  # historial completo actualizado
    }
)
```

**Importante**: `transicionar_estado()` actualmente es síncrono. El broadcast debe ser async. Solución: inyectar el `ConnectionManager` en el router y llamar al broadcast DESPUÉS del commit, usando `asyncio.create_task()` o un event loop.

### 4. Formato del evento WebSocket

```json
{
  "type": "estado_actualizado",
  "pedido_id": 123,
  "estado_anterior": "pendiente",
  "estado_nuevo": "pagado",
  "descripcion": "Pago confirmado",
  "timestamp": "2026-05-26T16:00:00Z",
  "historial": [
    {"estado": "pendiente", "descripcion": "Pedido creado", "timestamp": "..."},
    {"estado": "pagado", "descripcion": "Pago confirmado", "timestamp": "..."}
  ]
}
```

## Frontend

### 1. Hook useOrderWebSocket

```
frontend/src/hooks/useOrderWebSocket.ts
```

```typescript
interface UseOrderWebSocketResult {
  isConnected: boolean;
  lastEvent: OrderEvent | null;
  connectionError: string | null;
}

function useOrderWebSocket(
  pedidoId: number | null,
  options?: { fallbackInterval?: number }
): UseOrderWebSocketResult
```

Comportamiento:
- Conecta al WS cuando `pedidoId` no es null
- Envía heartbeat cada 30s para mantener alive
- Reconexión automática con exponential backoff (1s, 2s, 4s, 8s, 16s — max 5 intentos)
- Si se agotan los reintentos → activa polling con `refetchInterval` (30s por defecto)
- Al recibir mensaje → invalida `['orders', 'detail', pedidoId]` en React Query
- Cleanup al desmontar

URL del WS:
```
ws://localhost:8006/api/v1/ws/pedidos/{pedidoId}?token={jwt}
```

### 2. Componente OrderTrackingDashboard

```
frontend/src/components/OrderTrackingDashboard.tsx
```

Barra de progreso visual con 5 estados:

```
● ───── ● ───── ● ───── ● ───── ●
pendiente  pagado  preparando  enviado  entregado
```

- **Completados**: círculo verde con check, línea verde
- **Actual**: círculo azul pulsante, línea parcial
- **Futuros**: círculo gris, línea gris punteada

Props:
```typescript
interface OrderTrackingDashboardProps {
  estadoActual: string;
  historial: OrderHistorialResponse[];
  isConnected: boolean;  // indicador WS verde/rojo
}
```

### 3. Modificaciones en MisPedidos.tsx

- El hook `useOrders` ya tiene polling vía React Query. Agregar `refetchInterval: 30000` para mantener consistencia aunque WS esté caído.
- Cada pedido en la lista muestra el badge de estado (ya existe).
- **Opcional**: agregar indicador "Nuevo" o animación cuando un pedido cambia de estado.

### 4. Ruta de tracking dedicada (opcional)

Podríamos agregar una ruta `/mis-pedidos/:id/tracking` que muestre el dashboard en grande, ideal para que el cliente lo tenga abierto mientras espera.

### 5. Admin: OrdersDetailPage.tsx

- Cuando un admin está viendo el detalle de un pedido y otro admin (o el sistema via webhook) lo transiciona, el primero ve el cambio en tiempo real.
- Mismo hook `useOrderWebSocket`.

### 6. Indicador de conexión

- Un pequeño badge verde "🟢 En vivo" o rojo "🔴 Reconectando..." en el dashboard.
- Si está en modo fallback (polling), mostrar "🟡 Actualizando cada 30s".

## Seguridad

- El token JWT se pasa como query param `token` en la URL del WS
- El endpoint valida el token y verifica que el pedido pertenezca al cliente
- Si el token expiró, el server cierra la conexión
- El cliente debe reconectar con un token fresco

## Fallback Strategy

| Situación | Comportamiento |
|-----------|---------------|
| WS conectado | Eventos en tiempo real + React Query invalida cache |
| WS desconectado (reconectando) | React Query polling cada 30s |
| WS agotó reintentos | React Query polling permanente + badge "🔴" |
| Usuario cambia de página | Cleanup del WS, se reconecta al volver |

## Archivos a modificar/crear

### Backend
- `backend/app/core/websocket_manager.py` (NUEVO)
- `backend/app/modules/pedidos/router.py` (agregar endpoint WS)
- `backend/app/modules/pedidos/service.py` (agregar callback de broadcast)
- `backend/app/main.py` (registrar startup/shutdown del manager)

### Frontend
- `frontend/src/hooks/useOrderWebSocket.ts` (NUEVO)
- `frontend/src/components/OrderTrackingDashboard.tsx` (NUEVO)
- `frontend/src/pages/MisPedidos.tsx` (agregar indicadores, refetchInterval)
- `frontend/src/pages/OrderTrackingPage.tsx` (NUEVO - página dedicada de tracking)
- `frontend/src/router/index.tsx` (agregar ruta `/mis-pedidos/:id/tracking`)
- `frontend/src/api/orders.ts` (agregar helper de URL del WS)

### Specs
- `openspec/specs/order-management/spec.md` (agregar req de tiempo real)
