## Why

El sistema actual carece de un panel de administración funcional. Los endpoints `/admin/stats` y `/admin/delivery-dashboard` son placeholders que devuelven ceros. El dueño del negocio no tiene visibilidad de métricas clave (ventas, usuarios, pedidos) ni puede gestionar usuarios y roles desde el frontend. Sin esto, la plataforma no es operativamente útil para la gestión del día a día.

## What Changes

- **Backend — Endpoints de métricas**: Dashboard con stats globales (usuarios totales, pedidos totales, ingresos totales, pedidos por estado), ingresos en el tiempo (diario/semanal/mensual), productos más vendidos, y distribución de pedidos por estado.
- **Backend — Endpoints de gestión de usuarios**: CRUD de usuarios para admin (listar con roles, actualizar roles, soft delete/restore).
- **Backend — Endpoints de gestión de pedidos para admin**: Listar todos los pedidos con filtros (estado, fecha, cliente), cambiar estado manualmente.
- **Frontend — Admin Layout**: Layout compartido con sidebar de navegación para las secciones admin.
- **Frontend — Dashboard page**: Página principal del panel con cards de resumen, gráficos de ingresos (recharts), distribución de pedidos (pie chart), y tabla de pedidos recientes.
- **Frontend — Users management page**: Página CRUD de usuarios (tabla con roles, búsqueda, paginación, modal para editar roles).
- **Frontend — Orders management page**: Página de listado de pedidos con filtros y capacidad de cambiar estado.
- **Frontend — Admin routing**: Protección de rutas admin con `ProtectedRoute` y rol `Admin`.

## Capabilities

### New Capabilities
- `admin-dashboard`: Panel de administración con métricas globales, gráficos de ingresos y distribución de pedidos.
- `admin-user-management`: Gestión de usuarios (listar, roles, soft delete) para administradores.
- `admin-order-management`: Gestión de pedidos (listar con filtros, cambiar estado) para administradores.

### Modified Capabilities
- `authorization`: Se expande la semántica de `require_roles` — los endpoints admin existentes (`/admin/*`) se convierten de placeholders a implementaciones reales.
- `user-auth`: Se agrega la US-064 (cambio de contraseña desde perfil) — actualmente no hay endpoint de cambio de contraseña.

## Impact

- **Backend**: `backend/app/admin/` se expande significativamente — nuevo módulo con servicios, repositorios, schemas, y rutas para métricas y gestión. Se agregan consultas agregadas (SUM, COUNT, GROUP BY) sobre pedidos, pagos y usuarios.
- **Frontend**: Nuevas páginas en `frontend/src/app/pages/admin/`, nuevo layout compartido, nuevos stores/hooks para datos de dashboard y gestión de usuarios. Recharts ya está en dependencies.
- **Base de datos**: No se requieren migraciones nuevas — las tablas existentes (usuario, pedido, pago, pedido_historial, role) tienen los datos necesarios.
