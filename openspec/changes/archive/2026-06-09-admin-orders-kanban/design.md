# Diseño: Admin Orders Kanban

## Arquitectura

### Backend — WebSocket Broadcast para Admins

Se agrega un **canal global de administradores** al `ConnectionManager` existente:

```
ConnectionManager
├── rooms: dict[str, set[WebSocket]]   ← salas por pedido (existente)
└── admin_connections: set[WebSocket]   ← nueva sala global de admins
```

**Nuevo endpoint WebSocket:**
```
GET /api/v1/admin/pedidos/ws?token=<jwt>
```
- Verifica que el usuario tenga rol `admin`
- Conecta al WebSocket al set `admin_connections`
- Al recibir un mensaje de transición (broadcast), envía a TODOS los admins conectados

**Broadcast post-transición** (en `router.py`):
```python
# Existente: broadcast a la sala del pedido
await manager.broadcast(pedido_id, {"type": "order_updated", "order": {...}})
# Nuevo: broadcast a todos los admins
await manager.broadcast_admin({"type": "order_updated", "order": {...}})
```

**Estructura del mensaje admin:**
```json
{
  "type": "order_updated",
  "order": {
    "id": 5,
    "estado": "preparando",
    "estado_anterior": "pagado",
    "cliente_nombre": "Juan Pérez",
    "total": 25000,
    "items_count": 3,
    "creado_en": "2026-05-26T10:00:00"
  }
}
```

### Frontend — Kanban Board

**Librería drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`

**Estructura de componentes:**

```
AdminOrdersKanban.tsx          ← página principal (reemplaza OrdersPage)
├── Filtros (fecha desde/hasta)
└── KanbanBoard
    ├── StatusColumn (Pendiente)
    │   ├── OrderCard
    │   └── OrderCard
    ├── StatusColumn (Pagado)
    └── ...
```

**Flujo de drag & drop:**
1. Usuario agarra una `OrderCard` de columna A
2. La suelta en columna B (distinta)
3. Se llama a `PATCH /api/v1/pedidos/{id}/estado` con `{ nuevo_estado: "preparando" }`
4. Optimistic update: la card se mueve visualmente de inmediato
5. Si el backend responde error → se revierte al lugar original con toast de error
6. El broadcast del backend (post-transición) llega a TODOS los admins conectados

**WebSocket hook (`useAdminOrdersWebSocket`):**
- Se conecta a `ws://localhost:8006/api/v1/admin/pedidos/ws?token=<jwt>`
- Recibe mensajes `order_updated`
- Hace `queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })` para refrescar datos
- Reconexión automática con exponential backoff (mismo patrón que `useOrderWebSocket`)
- Badge de estado de conexión en la UI

**Estados de columna (orden fijo):**
1. Pendiente (ambar)
2. Pagado (azul)
3. Preparando (púrpura)
4. Enviado (cyan)
5. Entregado (verde)
6. Cancelado (rojo, al final)

### Data Flow

```
Admin A arrastra card ──→ PATCH /api/v1/pedidos/{id}/estado
                                │
                                ▼
                          Router: transition + broadcast
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
           Sala del pedido (WS)     Canal admin (WS)
                    │                       │
                    ▼                       ▼
           Cliente tracking     Admin A ✅ + Admin B ✅
           ve cambio en vivo     ven cambio en Kanban
```

### Dependencias nuevas

- `@dnd-kit/core` (^6.x)
- `@dnd-kit/sortable` (^6.x)

### Nuevo Rol: Cocinero — Diseño Técnico

**Archivos a modificar:**

| Archivo | Acción |
|---------|--------|
| `backend/app/auth/roles.py` | Modificar: +ROLE_COCINERO constante, +ALL_ROLES, +ROLE_DESCRIPTIONS |
| `backend/scripts/seed.py` | Modificar: +rol Cocinero en ROLES array |
| `backend/app/modules/pedidos/fsm.py` | Modificar: +"Cocinero" en TRANSITION_MAP para preparar, enviar y cancelar |
| `backend/app/modules/pedidos/router.py` | Modificar: mapeo de rol en transición + WS admin permitir Cocinero |

**Reglas de Transición FSM — Cocinero:**

| Estado Actual | Acción | Estado Destino | Roles Autorizados (cambio) |
|--------------|--------|----------------|---------------------------|
| pagado | preparar | preparando | `["Admin", "Cocinero"]` ← +Cocinero |
| preparando | enviar | enviado | `["Admin", "Cocinero"]` ← +Cocinero |
| pendiente | cancelar | cancelado | `["Cliente", "Admin", "Cocinero"]` ← +Cocinero |
| pagado | cancelar | cancelado | `["Admin", "Cocinero"]` ← +Cocinero |

**Mapeo de rol en `router.py` (línea 124):**

Actual (binario):
```python
usuario_rol = "Admin" if "Admin" in current_user.roles else "Cliente"
```

Nuevo (multi-rol):
```python
if "Admin" in current_user.roles:
    usuario_rol = "Admin"
elif "Cocinero" in current_user.roles:
    usuario_rol = "Cocinero"
else:
    usuario_rol = "Cliente"
```

**WebSocket de administradores (`/admin/ws`):**
- Actual: solo `"Admin"` puede conectar
- Nuevo: `"Admin"` o `"Cocinero"` pueden conectar (ambos necesitan ver el Kanban)

### Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `backend/app/auth/roles.py` | Modificar: +ROLE_COCINERO |
| `backend/scripts/seed.py` | Modificar: +rol Cocinero |
| `backend/app/modules/pedidos/fsm.py` | Modificar: permisos Cocinero en TRANSITION_MAP |
| `backend/app/modules/pedidos/router.py` | Modificar: mapeo de rol + WS |
| `backend/app/core/websocket_manager.py` | Modificar: +admin_connections, +broadcast_admin, +add_admin, +remove_admin |
| `backend/app/modules/pedidos/router.py` | Modificar: +WS endpoint /admin/pedidos/ws, +broadcast_admin post-transición |
| `frontend/src/pages/admin/OrdersPage.tsx` | Reemplazar: contenido completo con AdminOrdersKanban |
| `frontend/src/hooks/useAdminOrdersWebSocket.ts` | Crear: hook de WS para admin |
| `frontend/src/components/OrderCard.tsx` | Crear: card de pedido draggable |
| `frontend/src/components/StatusColumn.tsx` | Crear: columna droppable con header |
| `frontend/src/pages/admin/AdminOrdersKanban.tsx` | Crear: Kanban board (el componente raíz) |
