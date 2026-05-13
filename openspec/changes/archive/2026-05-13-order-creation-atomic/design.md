## Context

El change anterior (shopping-cart-persistence) implementó el carrito del lado del cliente con Zustand y persistencia en localStorage. El usuario puede agregar productos, personalizar ingredientes, y ver el total. Sin embargo, no hay forma de convertir el carrito en un pedido real.

Para crear un pedido necesitamos:
1. **Datos del cliente**: Dirección de entrega (del change 6)
2. **Productos validados**: Stock actual (del change 5)
3. **Carrito del cliente**: Contenido a pedir (del change 7)

El challenge principal es garantizar atomicidad: si falla cualquier paso (ej: stock insuficiente), todo el pedido debe rollbackearse para evitar inconsistencias.

## Goals / Non-Goals

**Goals:**
- Crear pedidos de forma atómica con rollback automático si falla
- Validar stock en el momento de creación (no cuando el usuario agregó al carrito)
- Guardar snapshots de precio y dirección para auditoría futura
- Registrar historial inicial del pedido con estado "pendiente"
- Exponer API para que clientes creen y listen sus pedidos

**Non-Goals:**
- Procesar pago (esto es change 10 - mercadopago-integration)
- Máquina de estados completa con transiciones (change 9 - order-fsm-and-trazability)
- Panel de administración de pedidos (change 11 - admin-dashboard-metrics)
- Notificaciones por email/SMS (fuera de scope)

## Decisions

### Decision 1: Unit of Work pattern para atomicidad

**Opción elegida**: Implementar Unit of Work en el servicio de pedidos que controle la transacción.

**Alternativas consideradas**:
- Transacción explícita en el router:too much responsibility en la capa HTTP
- Saga pattern: overkill para un solo agregado, overkill para operaciones síncronas

**Razionale**: El pedido es un agregado con múltiples entidades relacionadas (pedido → items → historial). Necesitamos atomicidad asegurada.

### Decision 2: Validación de stock con SELECT FOR UPDATE

**Opción elegida**: Bloquear las filas de productos durante la validación de stock.

**Alternativas consideradas**:
- Optimistic locking con versión: no nos protege de overselling entre requests simultáneos
- Check-then-update en memoria: no es atómico, vulnerable a race conditions

**Razionale**: SQLAlchemy permite `with_for_update()` en las queries. Esto previene que dos pedidos competitivos afecten el mismo stock simultáneamente.

### Decision 3: Snapshots de precio

**Opción elegida**: Guardar precio unitario y total en el momento de crear el pedido.

**Alternativas consideradas**:
- Solo guardar referencia al producto y recalcular al mostrar: vulnerables a cambios de precio históricos
- No guardar precio: imposible auditar qué precio tenía cada item

**Razionale**: Requisito legal y de negocio. Si el precio cambia después, necesitamos saber cuánto cobró realmente.

### Decision 4: Snapshot de dirección

**Opción elegida**: Guardar copia completa de la dirección (calle, número, ciudad, etc.) no solo el ID.

**Alternativas consideradas**:
- Solo guardar dirección ID: si el cliente-edita/elimina la dirección, pierde la referencia del pedido
- No guardar dirección: el pedido no tiene dónde entregarse si la dirección se modifica

**Razionale**: La dirección del pedido es un documento legal. Debe reflejar dónde se entregó realmente.

## Risks / Trade-offs

### Risk 1: Carrito desactualizado

El cliente puede tener productos en el carrito que ya no existen o cambiaron de precio.

**Mitigation**: Al crear el pedido, re-validar cada item contra la DB actual. Si algún producto cambió, rechazar con mensaje claro.

### Risk 2: Race conditions en stock

Dos usuarios compran el último unit del mismo producto simultáneamente.

**Mitigation**: Usar `SELECT FOR UPDATE` en la consulta de stock. El segundo request esperará hasta que el primero termine (commite o rollback).

### Risk 3: Carrito modificado entre vista y checkout

El usuario ve el carrito, otro proceso (ej: sesión en otro tab) modifica el contenido.

**Mitigation**: Accept the current cart state as a "snapshot" - what they submitted is what they ordered, regardless of what's currently in the cart.

### Risk 4: Fallo parcial en la creación

La transacción se corta a mitad de proceso.

**Mitigation**: El UoW hace rollback automático. La operación es idempotente - el usuario puede reintentar.