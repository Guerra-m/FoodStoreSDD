## 1. Configuración del Entorno y Estructura

- [x] 1.1 Crear estructura de directorios del monorepo (`/backend`, `/frontend`)
- [x] 1.2 Configurar backend (FastAPI, dependencias, CORS, variables de entorno)
- [x] 1.3 Configurar frontend (React, TypeScript, Vite, Tailwind, dependencias)
- [x] 1.4 Configurar `.gitignore` y `.env.example` en ambos entornos

## 2. Base de Datos y Patrones Backend

- [x] 2.1 Configurar PostgreSQL y conexión en `config.py`
- [x] 2.2 Implementar estructuras de modelos SQLModel iniciales
- [x] 2.3 Configurar Alembic y ejecutar migraciones iniciales
- [x] 2.4 Implementar `BaseRepository[T]` genérico
- [x] 2.5 Implementar `UnitOfWork` (context manager)
- [x] 2.6 Implementar handler global de errores (RFC 7807)
- [x] 2.7 Implementar script de Seed Data (idempotente)

## 3. Infraestructura Frontend

- [x] 3.1 Configurar instancia de Axios con interceptores (JWT + refresh)
- [x] 3.2 Inicializar `authStore` de Zustand con persistencia
- [x] 3.3 Inicializar `cartStore`, `uiStore` y `paymentStore` de Zustand
- [x] 3.4 Configurar `TanStack QueryProvider` y enrutamiento básico
