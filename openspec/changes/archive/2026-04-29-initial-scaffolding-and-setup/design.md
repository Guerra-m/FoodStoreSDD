## Context

El proyecto Food Store se encuentra en su fase inicial. Tenemos una especificación funcional detallada (`Integrador.txt`) y una lista de historias de usuario, pero no existe código base. Este diseño define la estructura monorepo, el stack tecnológico exacto y los patrones de diseño (Repository + Unit of Work) que se aplicarán para garantizar la escalabilidad y mantenibilidad del sistema.

## Goals / Non-Goals

**Goals:**
- Establecer una estructura de carpetas `feature-first` en el backend y `Feature-Sliced Design (FSD)` en el frontend.
- Configurar el entorno de base de datos con PostgreSQL y Alembic.
- Implementar los patrones `BaseRepository` y `Unit of Work` para desacoplar la lógica de negocio de la infraestructura de persistencia.
- Definir un manejo de errores estandarizado (RFC 7807).
- Configurar el cliente Axios con interceptores para el manejo automático de JWT.
- Inicializar los stores de Zustand con persistencia selectiva.

**Non-Goals:**
- Implementar lógica de negocio específica (Auth, Productos, Pedidos).
- Crear componentes visuales complejos o páginas funcionales.
- Integrar MercadoPago (será parte de un change futuro).

## Decisions

### 1. Estructura del Proyecto: Monorepo Simple
- **Decisión**: Usar una carpeta raíz con subcarpetas `/backend` y `/frontend`.
- **Razón**: Facilidad de gestión durante el desarrollo inicial.
- **Alternativa**: Repositorios separados, descartado por la sobrecarga de gestión en un equipo pequeño/un solo desarrollador.

### 2. Backend: FastAPI + SQLModel + Alembic
- **Decisión**: Usar SQLModel para unificar modelos de base de datos y esquemas de Pydantic.
- **Razón**: Reduce la duplicación de código y errores de sincronización entre la BD y la validación de API.
- **Alternativa**: SQLAlchemy + Pydantic por separado, descartado para ganar agilidad.

### 3. Patrón de Persistencia: Repository + Unit of Work
- **Decisión**: Los servicios no interactúan con la sesión de la BD directamente, sino a través de un `Unit of Work` que gestiona transacciones atómicas.
- **Razón**: Garantiza que operaciones complejas (como crear un pedido con múltiples detalles) sean atómicas. Facilita el testing mediante mocks de los repositorios.

### 4. Frontend: Feature-Sliced Design (FSD)
- **Decisión**: Organizar el frontend en capas: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- **Razón**: Evita el "espagueti" de componentes y establece reglas claras de qué puede importar a qué.

### 5. Estado del Frontend: Zustand + TanStack Query
- **Decisión**: Separar estrictamente el estado del servidor (TanStack Query) del estado del cliente (Zustand).
- **Razón**: TanStack Query maneja caching y sincronización de forma nativa. Zustand es ideal para estados ligeros como el carrito o la sesión.

## Risks / Trade-offs

- **[Riesgo]**: Curva de aprendizaje del patrón UoW con SQLModel asíncrono.
  - **Mitigación**: Implementar una versión base robusta y documentada en este change para que sirva de ejemplo.
- **[Riesgo]**: Configuración compleja de CORS entre frontend y backend en diferentes puertos.
  - **Mitigación**: Usar el middleware de CORS de FastAPI con orígenes configurables por `.env`.
- **[Riesgo]**: Interceptores de Axios entrando en loops infinitos de refresh.
  - **Mitigación**: Implementar una lógica de control en el interceptor para detectar intentos fallidos de refresh y redirigir al login.
