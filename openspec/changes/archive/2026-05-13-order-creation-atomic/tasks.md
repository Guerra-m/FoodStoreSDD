## 1. Base de Datos - Modelos

- [x] 1.1 Crear modelo `Pedido` en `backend/app/modules/pedidos/model.py` (id, cliente_id, direccion_id, direccion_snapshot, total, estado, timestamps)
- [x] 1.2 Crear modelo `PedidoItem` en `backend/app/modules/pedidos/model.py` (id, pedido_id, producto_id, producto_snapshot, cantidad, precio_unitario, ingredientes_excluidos)
- [x] 1.3 Crear modelo `PedidoHistorial` en `backend/app/modules/pedidos/model.py` (id, pedido_id, estado, timestamp, usuario_id, descripcion)
- [x] 1.4 Agregar migración Alembic para crear las tres tablas

## 2. Base de Datos - Schemas

- [x] 2.1 Crear `PedidoCreate` schema en `backend/app/modules/pedidos/schema.py` (carrito items, direccion_id)
- [x] 2.2 Crear `PedidoItemSchema` schema (producto_snapshot, cantidad, precio_unitario)
- [x] 2.3 Crear `PedidoResponse` schema (id, cliente_id, items, direccion_snapshot, total, estado, historial)
- [x] 2.4 Crear `PedidoListResponse` schema (pedidos, total, page, per_page)

## 3. Repository

- [x] 3.1 Crear `PedidoRepository` en `backend/app/modules/pedidos/repository.py` con métodos CRUD básicos
- [x] 3.2 Implementar `get_by_cliente` para listar pedidos de un cliente
- [x] 3.3 Implementar `create_with_items` para crear pedido + items en una transacción
- [x] 3.4 Implementar método para obtener historial de un pedido

## 4. Service - Unit of Work

- [x] 4.1 Crear `PedidoService` en `backend/app/modules/pedidos/service.py`
- [x] 4.2 Implementar `crear_pedido` con lógica UoW:
  - Validar que cada producto existe y está activo
  - Validar stock con `SELECT FOR UPDATE`
  - Validar precio actual vs precio en carrito
  - Validar dirección existe y pertenece al cliente
  - Crear snapshots de precios y dirección
  - Insertar pedido + items + historial (todo o nada)
  - Habilitar rollback automático en caso de excepción
- [x] 4.3 Implementar `listar_por_cliente` con paginación

## 5. Router - Endpoints

- [x] 5.1 Crear router en `backend/app/modules/pedidos/router.py` con prefijo `/api/v1/pedidos`
- [x] 5.2 Endpoint POST `/` - Crear pedido (requiere auth)
- [x] 5.3 Endpoint GET `/` - Listar pedidos del cliente (requiere auth)
- [x] 5.4 Endpoint GET `/{id}` - Ver detalle de pedido (requiere auth, solo propio)
- [x] 5.5 Endpoint GET `/{id}/historial` - Ver historial del pedido (requiere auth)

## 6. Integración con main.py

- [x] 6.1 Importar router de pedidos en `backend/main.py`
- [x] 6.2 Incluir router en la aplicación

## 7. Tests

- [ ] 7.1 Test: Crear pedido exitosamente
- [ ] 7.2 Test: Crear pedido con producto inactivo (debe fallar)
- [ ] 7.3 Test: Crear pedido con stock insuficiente (debe fallar)
- [ ] 7.4 Test: Crear pedido con precio cambiado (debe fallar)
- [ ] 7.5 Test: Race condition en stock (dos usuarios compran último item)
- [ ] 7.6 Test: Listar pedidos del cliente
- [ ] 7.7 Test: Ver pedido de otro cliente (debe retornar 404)

## 8. Frontend - API

- [x] 8.1 Crear `orderApi.ts` en `frontend/src/shared/api/`
- [x] 8.2 Implementar `createOrder(carrito, direccionId)`
- [x] 8.3 Implementar `getOrders()` 
- [x] 8.4 Implementar `getOrderById(id)`

## 9. Frontend - Hooks

- [x] 9.1 Crear `useOrders` hook en `frontend/src/shared/hooks/`
- [x] 9.2 Crear `useCreateOrder` mutation hook

## 10. Frontend - Página Mis Pedidos

- [x] 10.1 Crear página `MisPedidos.tsx` en `frontend/src/app/pages/`
- [x] 10.2 Mostrar lista de pedidos con estado, total, fecha
- [x] 10.3 Agregar ruta en App.tsx: `/mis-pedidos`
- [x] 10.4 Agregar link en navbar "Mis Pedidos"
- [x] 10.5 Agregar endpoint de checkout en el flujo del carrito

## 11. Documentación

- [ ] 11.1 Documentar los nuevos endpoints en README o swagger
- [ ] 11.2 Verificar que todos los tests pasen