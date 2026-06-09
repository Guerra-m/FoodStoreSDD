# Tasks: Admin Orders Kanban

## Backend

- [ ] **T1**: Modificar `ConnectionManager` — agregar `admin_connections: set[WebSocket]`, métodos `add_admin()`, `remove_admin()`, `broadcast_admin()`
- [ ] **T2**: Crear endpoint WebSocket `GET /api/v1/admin/pedidos/ws` en el router con verificación de rol admin
- [ ] **T3**: Modificar broadcast post-transición en `router.py` para también llamar a `broadcast_admin()` con datos del pedido actualizado

## Frontend

- [ ] **T4**: Instalar dependencias `@dnd-kit/core` y `@dnd-kit/sortable`
- [ ] **T5**: Crear hook `useAdminOrdersWebSocket` (conectar, reconectar, invalidar queries)
- [ ] **T6**: Crear componente `OrderCard` (draggable, muestra: ID, cliente, total, items, tiempo)
- [ ] **T7**: Crear componente `StatusColumn` (droppable, header con título + color + contador)
- [ ] **T8**: Crear `AdminOrdersKanban.tsx` (board con DndContext, filtros, 6 columnas, drag handler que llama transición API)
- [ ] **T9**: Reemplazar contenido de `OrdersPage.tsx` para que renderice `AdminOrdersKanban`

## Rol Cocinero

- [ ] **T10**: Agregar `ROLE_COCINERO = "Cocinero"` en `backend/app/auth/roles.py` (constante, ALL_ROLES, ROLE_DESCRIPTIONS)
- [ ] **T11**: Agregar rol Cocinero en `backend/scripts/seed.py` (array ROLES)
- [ ] **T12**: Actualizar `backend/app/modules/pedidos/fsm.py` — agregar "Cocinero" en TRANSITION_MAP para: pagado→preparar, preparando→enviar, pendiente→cancelar, pagado→cancelar
- [ ] **T13**: Actualizar `backend/app/modules/pedidos/router.py` — cambiar mapeo de rol (línea 124) para incluir Cocinero
- [ ] **T14**: Actualizar `backend/app/modules/pedidos/router.py` — WS `/admin/ws` permitir también rol Cocinero

## Documentación

- [ ] **T15**: Actualizar `openspec/specs/order-management/spec.md` con escenarios de Kanban + broadcast admin
