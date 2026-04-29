## ADDED Requirements

### Requirement: Patrón Unit of Work
El sistema SHALL implementar el patrón Unit of Work (UoW) para gestionar la atomicidad de las transacciones de negocio que involucran múltiples operaciones de base de datos.

#### Scenario: Fallo en operación transaccional
- **WHEN** ocurre una excepción dentro de un bloque manejado por el Unit of Work
- **THEN** el sistema SHALL ejecutar un rollback automático de todas las operaciones de base de datos realizadas en ese bloque

### Requirement: Repositorio Base Genérico
El sistema SHALL proveer una clase base para repositorios que implemente las operaciones CRUD comunes (Create, Read, Update, Soft Delete) de forma estandarizada.

#### Scenario: Uso de Soft Delete
- **WHEN** se invoca el método de soft delete en un repositorio para una entidad que lo soporte
- **THEN** el sistema SHALL actualizar el campo `eliminado_en` con el timestamp actual en lugar de borrar el registro físicamente
