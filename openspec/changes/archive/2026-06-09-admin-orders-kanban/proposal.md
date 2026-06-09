# Propuesta: Admin Orders Kanban

## ¿Qué?

Reemplazar la tabla actual de gestión de pedidos en el panel de admin (`/admin/orders`) por un **tablero Kanban** con columnas por estado donde se puedan **arrastrar y soltar** las cards de pedidos para transicionar entre estados.

## ¿Por qué?

La tabla actual es estática: hay que clickear "Detalle", ir a la página del pedido, cambiar estado con un dropdown y volver. Para un administrador que gestiona decenas de pedidos por día, esto es lento y frustrante.

El Kanban board permite:
- **Visibilidad instantánea** de qué pedidos están en cada estado
- **Transición con un solo gesto** (drag & drop)
- **Actualización en tiempo real** vía WebSockets (cambios de otros admins se reflejan solos)
- **UX profesional** al estilo Trello/Jira

## Alcance

### Kanban Board
- Reemplazo TOTAL de `OrdersPage.tsx` por `AdminOrdersKanban`
- Columnas: Pendiente | Pagado | Preparando | Enviado | Entregado | Cancelado
- Drag & drop entre columnas → llama al endpoint de transición existente
- Broadcast WebSocket a todos los admins conectados cuando un pedido cambia
- Cards con: ID, cliente, total, items, tiempo transcurrido
- Filtros: por fecha (desde/hasta)
- Sin paginación (scroll por columna)

### Nuevo Rol: Cocinero
- Se agrega el rol **Cocinero** al sistema RBAC
- Mismos permisos operativos que PEDIDOS pero enfocado en cocina:
  - Avanzar pedidos: Pagado → Preparando → Enviado
  - Cancelar pedidos en estado Pendiente o Pagado
- NO puede entregar pedidos (Enviado → Entregado)
- NO puede cancelar pedidos en Preparando (solo Admin)
- Acceso al WebSocket de administradores para ver cambios en vivo
- Autenticación JWT estándar (como todos los roles)
