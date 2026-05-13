## ADDED Requirements

### Requirement: Store de carrito con persistencia
El sistema SHALL extender el patrón de Zustand con persistencia definido en `client-state-management` para implementar un store específico del carrito de compras (`cartStore`), utilizando el middleware `persist` de Zustand con `localStorage` como medio de almacenamiento.

#### Scenario: Persistencia del carrito entre sesiones
- **WHEN** el usuario agrega productos al carrito, cierra el navegador y vuelve a ingresar
- **THEN** el sistema SHALL recuperar el estado del carrito desde `localStorage` a través del middleware de persistencia de Zustand

#### Scenario: Consistencia del store con el patrón existente
- **WHEN** el sistema inicializa el `cartStore`
- **THEN** el store SHALL seguir la misma estructura y convenciones que los stores existentes en `client-state-management` (selectors, actions atómicas, tipos)
