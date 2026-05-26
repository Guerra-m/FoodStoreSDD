# Tasks: Order Tracking Realtime

## Backend

### 1. Crear ConnectionManager
- [x] Crear `backend/app/core/websocket_manager.py`
- [x] Implementar `ConnectionManager` con:
  - `active_connections: dict[int, list[WebSocket]]`
  - `connect(pedido_id, websocket)` — agrega WS a la lista
  - `disconnect(pedido_id, websocket)` — remueve WS, limpia si queda vacío
  - `broadcast(pedido_id, data)` — envía JSON a todos los WS suscriptos, maneja disconnect si el cliente se fue
- [x] Inicializar como singleton (instancia global)

### 2. Crear WebSocket endpoint
- [x] Agregar endpoint en `backend/app/modules/pedidos/router.py`:
  ```
  WS /api/v1/pedidos/ws/{pedido_id}
  ```
- [x] Recibir token JWT como query param (`?token=...`)
- [x] Validar token con `verify_jwt_token`
- [x] Verificar que el pedido exista y pertenezca al cliente autenticado (o sea admin)
- [x] Suscribir el socket al `pedido_id` via `ConnectionManager.connect()`
- [x] Manejar disconnect graceful (try/except en el receive loop)
- [x] Mantener conexión abierta (loop de receive + heartbeat ping/pong)

### 3. Disparar broadcast desde transición
- [x] Broadcast desde el router DESPUÉS del service exitoso (router es async)
- [x] Construir el evento con: `type`, `pedido_id`, `estado_anterior`, `estado_nuevo`, `descripcion`, `timestamp`, `historial`

### 4. Integrar en main.py
- [x] Sin cambios necesarios — `pedidos_router` ya está incluído en main.py
- [x] FastAPI soporta WebSocket nativamente (vía Starlette)
- [x] ConnectionManager es standalone, no necesita registración

### 5. Actualizar specs de order-management
- [x] Agregar requirement de WebSocket tracking en `openspec/specs/order-management/spec.md`
- [x] Incluir scenarios: conexión exitosa, evento recibido, token inválido, admin, disconnect, fallback

## Frontend

### 6. Hook useOrderWebSocket
- [x] Crear `frontend/src/hooks/useOrderWebSocket.ts`
- [x] Conectar al WebSocket con JWT del localStorage
- [x] Manejar eventos `onopen`, `onmessage` (parsear JSON), `onclose`, `onerror`
- [x] Reconexión automática con exponential backoff (1s, 2s, 4s, 8s, 16s — max 5)
- [x] Al recibir `estado_actualizado`: invalidar React Query cache
- [x] Retornar: `{ connectionStatus, lastEvent, connectionError, reconnect }`
- [x] Cleanup al desmontar (cerrar WS)
- [x] Fallback: si se agotan los reintentos, activar modo polling (configurable)
- [x] Heartbeat ping/pong para mantener alive

### 7. Componente OrderTrackingDashboard
- [x] Crear `frontend/src/components/OrderTrackingDashboard.tsx`
- [x] Barra de progreso horizontal con 5 estados
- [x] Estados completados: círculo verde con check, línea sólida verde
- [x] Estado actual: círculo azul con glow/pulse animation
- [x] Estados futuros: círculo gris
- [x] Timeline de eventos (historial) debajo de la barra
- [x] Badge de conexión: 🟢 En vivo / 🟡 Polling / 🔴 Desconectado
- [x] Estado cancelado con alerta visual
- [x] Diseño responsive

### 8. Página OrderTrackingPage
- [x] Crear `frontend/src/pages/OrderTrackingPage.tsx`
- [x] Ruta: `/mis-pedidos/:id/tracking`
- [x] Cargar detalle del pedido con `useOrderById(pedidoId)`
- [x] Mostrar `OrderTrackingDashboard` con datos del pedido
- [x] Mostrar resumen del pedido (items, total, dirección)
- [x] Botón "Volver a Mis Pedidos"
- [x] Sincronizar estado del WS con el estado REST (usa el último evento disponible)

### 9. Actualizar MisPedidos.tsx
- [x] Agregar `refetchInterval: 30000` a `useOrders` (polling de fallback)
- [x] Agregar enlace "Ver Tracking" en cada pedido no terminal
- [x] El botón de tracking redirige a `/mis-pedidos/:id/tracking`

### 10. Actualizar Admin OrderDetailPage
- [x] Usar `useOrderWebSocket` para cambios en tiempo real
- [x] Invalidar queries de admin al recibir evento WS
- [x] Mostrar badge de conexión (En vivo / Polling)
- [x] Polling de fallback cada 30s

### 11. Actualizar router
- [x] Agregar ruta en `frontend/src/router/index.tsx`:
  ```tsx
  <Route path="/mis-pedidos/:id/tracking" element={<OrderTrackingPage />} />
  ```

### 12. Helper URL del WS
- [x] Agregar `getOrderWebSocketUrl` en `frontend/src/api/orders.ts`
- [x] Convierte `http://...` a `ws://...` automáticamente
- [x] Usa `VITE_API_BASE_URL` o fallback a localhost:8006
