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

## Documentación

- [ ] **T10**: Actualizar `openspec/specs/order-management/spec.md` con escenarios de Kanban + broadcast admin
