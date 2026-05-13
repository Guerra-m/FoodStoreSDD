## 1. FSM Class

- [x] 1.1 Crear clase `OrderFSM` en `backend/app/modules/pedidos/fsm.py` con el mapa de transiciones definido en el design (pendiente→pagado, pendiente→cancelado, pagado→preparando, pagado→cancelado, preparando→enviado, preparando→cancelado, enviado→entregado)
- [x] 1.2 Implementar método `can_transition(current_state: str, action: str) -> bool` que valide si una acción está permitida desde el estado actual
- [x] 1.3 Implementar método `get_next_state(current_state: str, action: str) -> str` que retorne el estado destino
- [x] 1.4 Implementar método `get_allowed_actions(current_state: str, user_role: str) -> list[str]` que retorne las acciones disponibles según el estado y el rol del usuario (cliente solo ve "cancelar" en pendiente; admin ve todas las válidas)
- [x] 1.5 Implementar método `is_terminal_state(state: str) -> bool` para identificar estados terminales (entregado, cancelado)

## 2. Service Layer - Transiciones

- [x] 2.1 Agregar método `transicionar_estado(pedido_id: int, accion: str, usuario_id: int, usuario_rol: str)` en `PedidoService`
- [x] 2.2 Integrar validación de `OrderFSM.can_transition` antes de ejecutar cualquier transición
- [x] 2.3 Implementar verificación de autorización: si el usuario es cliente, solo permitir "cancelar" en estado "pendiente"; si es admin, permitir todas las acciones válidas
- [x] 2.4 Agregar verificación de pertenencia: si el usuario es cliente, verificar que el pedido le pertenezca (retornar 404 si no)
- [x] 2.5 Implementar registro en `PedidoHistorial` con timestamp, usuario_id y descripción descriptiva para cada transición
- [x] 2.6 Implementar restauración de stock al cancelar: usar `PedidoRepository.decrement_stock` con cantidad negativa (o nuevo método `restore_stock`) para cada producto del pedido
- [x] 2.7 Usar `SELECT FOR UPDATE` al leer el pedido dentro de la transición para evitar condiciones de carrera

## 3. API Endpoint

- [x] 3.1 Agregar schema `TransicionRequest` con campo `accion: str` y validador de acciones permitidas en `backend/app/modules/pedidos/schema.py`
- [x] 3.2 Agregar endpoint `POST /api/v1/pedidos/{id}/transicion` en el router de pedidos, que reciba `TransicionRequest` y use `Depends(CurrentUser())` para autenticación
- [x] 3.3 Integrar el endpoint con `PedidoService.transicionar_estado` y retornar `PedidoResponse` actualizado
- [x] 3.4 Manejar errores: 400 para transición inválida, 403 para rol no autorizado, 404 si no existe el pedido

## 4. Testing

- [x] 4.1 Escribir tests unitarios de `OrderFSM` que cubran todas las transiciones válidas e inválidas del mapa
- [x] 4.2 Escribir tests unitarios de `OrderFSM.get_allowed_actions` para roles cliente y admin en cada estado
- [x] 4.3 Escribir tests de `transicionar_estado` covering: transición exitosa, transición inválida (error 400), cancelación con restauración de stock, cliente no autorizado (error 403/404)
- [x] 4.4 Escribir test de integración del endpoint `POST /pedidos/{id}/transicion` probando el flujo completo: crear pedido → pagar → preparar → enviar → entregar, verificando el historial en cada paso
