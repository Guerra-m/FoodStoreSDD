# admin-dashboard Specification

## Purpose
Panel de administración con métricas globales del negocio, incluyendo estadísticas de ventas, pedidos, usuarios e ingresos, presentadas en gráficos interactivos.

## ADDED Requirements

### Requirement: Obtener estadísticas globales del dashboard
El sistema SHALL proveer un endpoint `GET /admin/dashboard/stats` que devuelva métricas globales del negocio.

#### Scenario: Stats retornan métricas correctas
- **WHEN** un usuario autenticado con rol Admin accede a `GET /admin/dashboard/stats`
- **THEN** el sistema SHALL devolver: total de usuarios, total de pedidos, ingresos totales (suma de totales de pedidos pagados/entregados), y pedidos agrupados por estado

#### Scenario: Stats con datos vacíos
- **WHEN** no existen pedidos ni usuarios en el sistema
- **THEN** el sistema SHALL devolver ceros en todas las métricas (no errores)

### Requirement: Obtener ingresos en el tiempo
El sistema SHALL proveer un endpoint `GET /admin/dashboard/revenue` que devuelva ingresos agregados por período.

#### Scenario: Ingresos por día
- **WHEN** un admin solicita ingresos con período `daily`
- **THEN** el sistema SHALL devolver una lista de {fecha, ingreso_total} para los últimos 30 días, considerando solo pedidos con estado pagado o entregado

#### Scenario: Ingresos por mes
- **WHEN** un admin solicita ingresos con período `monthly`
- **THEN** el sistema SHALL devolver una lista de {mes, año, ingreso_total} para los últimos 12 meses

#### Scenario: Período inválido
- **WHEN** un admin solicita ingresos con un período no soportado
- **THEN** el sistema SHALL devolver un error 422 (Validation Error)

### Requirement: Obtener productos más vendidos
El sistema SHALL proveer un endpoint `GET /admin/dashboard/top-products` que devuelva los productos con más unidades vendidas.

#### Scenario: Top 10 productos
- **WHEN** un admin solicita productos más vendidos
- **THEN** el sistema SHALL devolver hasta 10 productos con {id, nombre, cantidad_vendida, ingreso_total} ordenados por cantidad descendente

#### Scenario: Sin ventas
- **WHEN** no existen items de pedidos en estado pagado o entregado
- **THEN** el sistema SHALL devolver una lista vacía

### Requirement: Obtener distribución de pedidos por estado
El sistema SHALL proveer un endpoint `GET /admin/dashboard/orders-by-status` que devuelva el conteo de pedidos agrupados por estado.

#### Scenario: Distribución correcta
- **WHEN** un admin solicita la distribución de pedidos
- **THEN** el sistema SHALL devolver una lista de {estado, cantidad} para cada estado definido en EstadoPedido

### Requirement: Dashboard frontend con gráficos
El sistema SHALL mostrar una página `/admin` con un dashboard visual que consuma los endpoints de métricas.

#### Scenario: Dashboard carga todos los gráficos
- **WHEN** un usuario Admin navega a `/admin`
- **THEN** el sistema SHALL mostrar: cards de resumen (usuarios, pedidos, ingresos), un gráfico de líneas con ingresos en el tiempo (recharts), un gráfico de torta con distribución de pedidos, y una tabla con los productos más vendidos

#### Scenario: Dashboard sin datos
- **WHEN** no hay datos en el sistema
- **THEN** el dashboard SHALL mostrar valores en cero y gráficos vacíos (no romperse)

#### Scenario: Error de carga
- **WHEN** falla la carga de métricas
- **THEN** el sistema SHALL mostrar un toast de error y los gráficos en estado de error/empty
