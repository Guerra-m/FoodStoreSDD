## ADDED Requirements

### Requirement: Store de direcciones en Zustand
El sistema SHALL proveer un store de Zustand para la gestión de estado de direcciones del cliente, con persistencia opcional en LocalStorage.

#### Scenario: Carga inicial de direcciones
- **WHEN** el usuario autenticado navega a la sección de direcciones
- **THEN** el store SHALL cargar las direcciones desde la API y actualizar el estado global

#### Scenario: Actualización tras operación CRUD
- **WHEN** el usuario crea, edita o elimina una dirección
- **THEN** el store SHALL reflejar el cambio inmediatamente sin esperar recarga de página
