# client-state-management Specification

## Purpose
TBD - created by archiving change initial-scaffolding-and-setup. Update Purpose after archive.
## Requirements
### Requirement: Stores de Zustand con Persistencia
El sistema SHALL utilizar Zustand para la gestión de estado global del cliente, permitiendo la persistencia selectiva de datos en LocalStorage.

#### Scenario: Persistencia del carrito tras recarga
- **WHEN** el usuario agrega un item al carrito y recarga la página
- **THEN** el sistema SHALL recuperar los items del carrito desde el LocalStorage a través del `cartStore`

### Requirement: Interceptor de Axios para JWT
El sistema SHALL configurar un cliente Axios con interceptores que adjunten automáticamente el token de acceso en las peticiones y manejen la renovación transparente ante errores 401.

#### Scenario: Renovación automática de token
- **WHEN** una petición recibe un error 401 (Unauthorized)
- **THEN** el sistema SHALL intentar obtener un nuevo token usando el refresh token y reintentar la petición original automáticamente

## ADDED Requirements

### Requirement: Store de direcciones en Zustand
El sistema SHALL proveer un store de Zustand para la gestión de estado de direcciones del cliente, con persistencia opcional en LocalStorage.

#### Scenario: Carga inicial de direcciones
- **WHEN** el usuario autenticado navega a la sección de direcciones
- **THEN** el store SHALL cargar las direcciones desde la API y actualizar el estado global

#### Scenario: Actualización tras operación CRUD
- **WHEN** el usuario crea, edita o elimina una dirección
- **THEN** el store SHALL reflejar el cambio inmediatamente sin esperar recarga de página

### Requirement: Store de carrito con persistencia
El sistema SHALL extender el patrón de Zustand con persistencia definido en `client-state-management` para implementar un store específico del carrito de compras (`cartStore`), utilizando el middleware `persist` de Zustand con `localStorage` como medio de almacenamiento.

#### Scenario: Persistencia del carrito entre sesiones
- **WHEN** el usuario agrega productos al carrito, cierra el navegador y vuelve a ingresar
- **THEN** el sistema SHALL recuperar el estado del carrito desde `localStorage` a través del middleware de persistencia de Zustand

#### Scenario: Consistencia del store con el patrón existente
- **WHEN** el sistema inicializa el `cartStore`
- **THEN** el store SHALL seguir la misma estructura y convenciones que los stores existentes en `client-state-management` (selectors, actions atómicas, tipos)

