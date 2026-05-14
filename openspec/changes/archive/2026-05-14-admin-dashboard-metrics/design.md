## Context

La aplicación FoodStore tiene backend FastAPI con módulos de usuarios, productos, categorías, ingredientes, direcciones, pedidos y pagos. Existe un router admin placeholder (`backend/app/admin/routes.py`) con endpoints `/admin/test`, `/admin/stats` y `/admin/delivery-dashboard` que devuelven datos dummy. El frontend tiene React+Vite con recharts ya instalado en dependencies.

No existe:
- Un panel de administración real con métricas
- Gestión de usuarios desde el frontend
- Gestión de pedidos desde el frontend
- Un layout compartido para las secciones admin

## Goals / Non-Goals

**Goals:**
- Proveer endpoints REST reales para métricas del dashboard (stats globales, ingresos en el tiempo, productos más vendidos, distribución de pedidos)
- Proveer endpoints CRUD de usuarios para admin (listar con roles, actualizar roles, soft delete/restore)
- Proveer endpoints de gestión de pedidos para admin (listar con filtros, cambiar estado)
- Construir frontend admin con layout compartido (sidebar), dashboard con gráficos, y páginas de gestión de usuarios y pedidos
- Proteger todas las rutas admin con rol `Admin`

**Non-Goals:**
- No se modifican los modelos de base de datos existentes — las tablas actuales tienen los datos necesarios
- No se implementa exportación de reportes (CSV/PDF) — queda para cambio futuro
- No se implementan notificaciones push ni emails
- No se implementan gráficos en tiempo real (WebSockets) — los dashboards se actualizan con fetch on mount y refresh manual

## Decisions

### 1. Métricas vía endpoints REST dedicados (no GraphQL)
**Alternativa considerada**: GraphQL con Hasura o Strawberry.
**Decisión**: REST simple con endpoints dedicados en `backend/app/admin/`.
**Por qué**: El equipo trabaja con FastAPI + REST. No hay necesidad actual de queries ad-hoc. Los endpoints de métricas son predecibles y pocos. GraphQL agregaría complejidad innecesaria.

### 2. Cálculo de métricas en tiempo real (no tablas agregadas)
**Alternativa considerada**: Tablas de agregados con triggers o tareas programadas (cron).
**Decisión**: Las métricas se calculan con consultas SQL agregadas (SUM, COUNT, GROUP BY) sobre las tablas existentes.
**Por qué**: El volumen de datos actual es bajo (proyecto universitario). No justifica la complejidad de mantener tablas agregadas sincronizadas. Si el volumen crece, se puede migrar a materialized views o cache Redis.

### 3. Admin Layout con sidebar en React
**Alternativa considerada**: Rutas admin separadas en un subdominio o SPA independiente.
**Decisión**: El admin vive dentro del mismo frontend, bajo `/admin/*` con un layout compartido.
**Por qué**: Comparte el mismo auth context, axios instance, y stores. Más simple de mantener. La protección por ruta ya existe con `ProtectedRoute`.

### 4. Gráficos con recharts (ya instalado)
**Alternativa considerada**: Chart.js, Nivo, Tremor.
**Decisión**: Usar recharts que ya está en `package.json`.
**Por qué**: Zero cost de instalación, API declarativa que encaja bien con React, suficiente para los gráficos necesarios (bar chart, line chart, pie chart).

### 5. Admin endpoints bajo router existente en `backend/app/admin/`
**Alternativa considerada**: Mover admin a un módulo separado `backend/app/modules/admin/`.
**Decisión**: Expandir `backend/app/admin/` con subdirectorios `routes/`, `services/`, `schemas/`.
**Por qué**: Ya existe el router admin registrado en `main.py`. Co-location: todo lo administrativo en un solo lugar.

## Risks / Trade-offs

- **[Riesgo] Queries agregadas lentas con muchos datos** → Mitigación: Las tablas tienen índices en `creado_en`, `cliente_id`, `estado`. Si escala, se agrega paginación o cache.
- **[Riesgo] Admin expone datos sensibles** → Mitigación: Todos los endpoints admin requieren `require_roles([ROLE_ADMIN])`. Los schemas de respuesta admin pueden incluir más campos (ej. password hashes NO se exponen).
- **[Trade-off] Sin actualización en tiempo real** → El usuario debe refrescar la página o hacer click en "Actualizar". Aceptable para un MVP.
