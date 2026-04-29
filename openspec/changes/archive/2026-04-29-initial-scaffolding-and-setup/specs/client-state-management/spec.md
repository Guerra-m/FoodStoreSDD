## ADDED Requirements

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
