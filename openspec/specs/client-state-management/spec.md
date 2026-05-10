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

