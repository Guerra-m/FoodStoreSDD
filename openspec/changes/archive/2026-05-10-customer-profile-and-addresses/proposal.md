## Why

El sistema ya cuenta con catálogo de productos, categorías e ingredientes, pero no tiene un perfil de cliente con direcciones de entrega. Sin esto, no se puede avanzar con el carrito de compras (change 7) ni con pedidos (change 8). Necesitamos que los clientes puedan gestionar su perfil y direcciones antes de comprar.

## What Changes

- Extender el modelo `Usuario` existente con campos de perfil (nombre completo, teléfono ya existe, foto opcional, fecha de nacimiento opcional)
- Crear un módulo independiente `direcciones` para gestión de direcciones de entrega
- El cliente puede tener múltiples direcciones, una marcada como "principal"
- Endpoints CRUD para perfil del cliente (ver/editar)
- Endpoints CRUD para direcciones (crear, listar, editar, eliminar, marcar principal)
- Frontend: página de perfil de cliente con formulario editable
- Frontend: sección de direcciones con CRUD y selección de dirección principal
- Proteger rutas con rol "Cliente" (cualquier usuario autenticado con ese rol)

## Capabilities

### New Capabilities
- `customer-profile`: Gestión del perfil del cliente — visualización y edición de datos personales del usuario autenticado con rol Cliente
- `address-management`: Gestión de direcciones de entrega — CRUD de direcciones asociadas a un cliente con capacidad de marcar una como principal

### Modified Capabilities
- `user-auth`: El endpoint de perfil actual (`GET /me`) se extiende para devolver también las direcciones del cliente. Se agrega endpoint `PATCH /me` para actualizar perfil.
- `client-state-management`: Se agrega store de direcciones en Zustand con persistencia opcional

## Impact

- **Backend**: Nuevo módulo `direcciones/` (model, repository, service, router, schema, tests). Modificación del modelo `Usuario` con nuevos campos opcionales.
- **Frontend**: Nueva página `MiPerfil.tsx` con secciones de perfil y direcciones. Nuevo hook `useDirecciones.ts`. Nuevo store `addressStore.ts`.
- **Base de datos**: Nueva tabla `direccion`. Migración Alembic para agregar campos al `usuario`.
- **API**: Endpoints nuevos bajo `/api/v1/clientes/perfil` y `/api/v1/clientes/direcciones`.
