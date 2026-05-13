## Why

La creación de pedidos es la operación más crítica del sistema de e-commerce. Actualmente no existe persistencia de pedidos — el usuario puede agregar productos al carrito pero no hay forma de convertir eso en un pedido real con garantías de integridad. Necesitamos implementar la creación atómica de pedidos que garantice: (1) no perder dinero por fallos parciales, (2) validar stock correctamente para evitar overselling, (3) guardar snapshots de precios y direcciones para auditoría.

## What Changes

- Crear módulo `pedidos` con modelos, schemas, servicios y routers
- Implementar Unit of Work (UoW) para garantiza atomicidad en la creación de pedidos
- Agregar validación de stock con `SELECT FOR UPDATE` para evitar condiciones de carrera
- Generar snapshots de precio (al momento de crear el pedido) y dirección de entrega
- Crear tabla de historial de pedidos con estado inicial "pendiente"
- Agregar endpoint público para que clientes creen pedidos desde su carrito
- Exponer endpoint para que clientes vean sus pedidos

## Capabilities

### New Capabilities

- `order-management`: Creación atómica de pedidos con validación de stock, snapshots de precio/dirección, y máquina de estados básica (pendiente → pagado/enviado/entregado viene en change 9)
- `order-history`: Historial de pedidos por cliente con información de estado y totales

### Modified Capabilities

- Ninguno. Este change introduce capacidades nuevas sin modificar requisitos existentes.

## Impact

- **Backend**: Nuevo módulo `app/modules/pedidos/` con toda la estructura
- **Base de datos**: Nuevas tablas `pedido`, `pedido_item`, `pedido_historial`
- **API**: Endpoints `/api/v1/pedidos` (POST crear, GET listar) y `/api/v1/pedidos/{id}`
- **Frontend**: Panel de "Mis Pedidos" en el perfil del cliente (change 7 tenía el carrito, esto conecta el checkout)
- **Dependencias**: Requiere shopping-cart (change 7), customer-profile (change 6), y productos (change 5)