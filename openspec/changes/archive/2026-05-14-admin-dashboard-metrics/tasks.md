## 1. Backend — Expandir módulo admin

- [x] 1.1 Crear estructura de archivos en `backend/app/admin/`: `schemas.py`, `services/dashboard_service.py`, `services/user_service.py`, `services/order_service.py`, `repositories/dashboard_repo.py`, `repositories/user_repo.py`
- [x] 1.2 Refactorizar `backend/app/admin/routes.py` para usar sub-routers: `/admin/dashboard`, `/admin/users`, `/admin/orders`
- [x] 1.3 Registrar los nuevos sub-routers en `backend/main.py` (el router admin ya está, pero se expande)

## 2. Backend — Endpoints de Dashboard (métricas)

- [x] 2.1 Implementar `DashboardRepository` con queries agregadas: total usuarios, total pedidos, ingresos totales, pedidos por estado
- [x] 2.2 Implementar `DashboardService` que orqueste las métricas y maneje casos sin datos
- [x] 2.3 Implementar `GET /admin/dashboard/stats` que devuelva métricas globales
- [x] 2.4 Implementar `GET /admin/dashboard/revenue?period=daily|monthly` con ingresos agrupados por período
- [x] 2.5 Implementar `GET /admin/dashboard/top-products` con top 10 productos más vendidos
- [x] 2.6 Implementar `GET /admin/dashboard/orders-by-status` con distribución de pedidos
- [x] 2.7 Definir schemas Pydantic de respuesta para cada endpoint de dashboard

## 3. Backend — Endpoints de Gestión de Usuarios (admin)

- [x] 3.1 Implementar `UserAdminRepository` con métodos: listar usuarios (con paginación, búsqueda, filtro por rol, include_deleted), get by ID, actualizar roles, soft delete, restore
- [x] 3.2 Implementar `UserAdminService` que delegue en el repo y maneje validaciones (rol inválido, usuario ya eliminado, etc.)
- [x] 3.3 Implementar `GET /admin/users` con paginación, búsqueda por email, filtro por rol, include_deleted
- [x] 3.4 Implementar `GET /admin/users/{id}` con detalle completo de usuario
- [x] 3.5 Implementar `PUT /admin/users/{id}/roles` para actualizar roles (reemplazar lista completa)
- [x] 3.6 Implementar `DELETE /admin/users/{id}` para soft delete
- [x] 3.7 Implementar `POST /admin/users/{id}/restore` para restaurar usuario
- [x] 3.8 Definir schemas de respuesta admin para usuarios (incluyen más datos que el perfil público)

## 4. Backend — Endpoints de Gestión de Pedidos (admin)

- [x] 4.1 Implementar `OrderAdminRepository` con métodos: listar pedidos (con filtros por estado, fecha, cliente, paginación), obtener detalle completo
- [x] 4.2 Implementar `OrderAdminService` que reutilice `PedidoService.transicionar_estado()` para cambios de estado (la FSM ya existe)
- [x] 4.3 Implementar `GET /admin/orders` con filtros por estado, date_from, date_to, cliente_id, paginación
- [x] 4.4 Implementar `GET /admin/orders/{id}` con detalle completo (items, historial, pago, cliente)
- [x] 4.5 Implementar `PUT /admin/orders/{id}/status` que reciba una acción FSM y la ejecute reutilizando `PedidoService.transicionar_estado()`
- [x] 4.6 Definir schemas de respuesta admin para pedidos

## 5. Frontend — Admin Layout y Routing

- [x] 5.1 Crear `frontend/src/app/components/admin/Sidebar.tsx` con navegación: Dashboard, Usuarios, Pedidos
- [x] 5.2 Crear `frontend/src/app/components/admin/AdminLayout.tsx` con sidebar + contenido
- [x] 5.3 Crear `frontend/src/app/pages/admin/DashboardPage.tsx` (ruta `/admin`)
- [x] 5.4 Crear `frontend/src/app/pages/admin/UsersPage.tsx` (ruta `/admin/users`)
- [x] 5.5 Crear `frontend/src/app/pages/admin/OrdersPage.tsx` (ruta `/admin/orders`)
- [x] 5.6 Crear `frontend/src/app/pages/admin/OrderDetailPage.tsx` (ruta `/admin/orders/:id`)
- [x] 5.7 Agregar rutas admin en `App.tsx` envueltas en `ProtectedRoute allowedRoles={['Admin']}` con el `AdminLayout`
- [x] 5.8 Agregar link al dashboard admin en la Navbar (solo visible para Admins)

## 6. Frontend — Admin API layer

- [x] 6.1 Crear `frontend/src/shared/api/adminApi.ts` con funciones para todos los endpoints admin
- [x] 6.2 Crear types en `frontend/src/features/admin/types.ts` para las respuestas del admin API

## 7. Frontend — Dashboard Page con gráficos

- [x] 7.1 Crear hook `useAdminDashboard` que cargue todas las métricas (stats, revenue, top-products, orders-by-status) con `@tanstack/react-query`
- [x] 7.2 Crear componente `SummaryCards` con cards de: usuarios totales, pedidos totales, ingresos totales, pedidos pendientes
- [x] 7.3 Crear componente `RevenueChart` con recharts `<LineChart>` mostrando ingresos en el tiempo
- [x] 7.4 Crear componente `OrdersByStatusChart` con recharts `<PieChart>` mostrando distribución de estados
- [x] 7.5 Crear componente `TopProductsTable` con tabla de productos más vendidos
- [x] 7.6 Maquetar `DashboardPage` con los componentes en grid responsivo
- [x] 7.7 Manejar estados de carga (skeleton/spinner) y error (toast + mensaje)

## 8. Frontend — Users Management Page

- [x] 8.1 Implementar tabla de usuarios con columnas: nombre, email, roles (badges), fecha de registro, acciones
- [x] 8.2 Agregar campo de búsqueda por email y filtro por rol (dropdown)
- [x] 8.3 Implementar paginación (controles siguiente/anterior con total de páginas)
- [x] 8.4 Crear modal `EditRolesModal` con checkboxes para Admin/Delivery/Cliente y botón guardar
- [x] 8.5 Agregar botón de "Eliminar" con confirmación y "Restaurar" para usuarios eliminados
- [x] 8.6 Manejar estados de carga, empty (sin resultados), y error

## 9. Frontend — Orders Management Page

- [x] 9.1 Implementar tabla de pedidos con columnas: ID, cliente, total (formateado), estado (badge con color), fecha
- [x] 9.2 Agregar filtros: dropdown de estado, date picker o inputs de fecha desde/hasta
- [x] 9.3 Implementar paginación
- [x] 9.4 Crear `OrderDetailPage` con detalle completo: items del pedido, historial de cambios (timeline visual), info de pago, datos del cliente
- [x] 9.5 En el detalle, agregar selector de acciones FSM válidas (solo mostrar las permitidas desde el estado actual) con botón "Aplicar"
- [x] 9.6 Agregar confirmación antes de ejecutar cambio de estado
- [x] 9.7 Manejar estados de carga, empty, y error
