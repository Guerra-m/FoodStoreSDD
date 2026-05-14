# admin-user-management Specification

## Purpose
Gestión de usuarios del sistema para administradores, permitiendo listar usuarios, asignar roles, y realizar soft delete/restore.

## ADDED Requirements

### Requirement: Listar usuarios (admin)
El sistema SHALL proveer un endpoint `GET /admin/users` que liste todos los usuarios con paginación, incluyendo sus roles y estado.

#### Scenario: Listado paginado
- **WHEN** un admin solicita `GET /admin/users?page=1&per_page=20`
- **THEN** el sistema SHALL devolver una página con usuarios incluyendo id, nombre, email, teléfono, roles, fecha de registro, y si está eliminado (soft delete), más el total de usuarios

#### Scenario: Búsqueda por email
- **WHEN** un admin solicita `GET /admin/users?search=john@example.com`
- **THEN** el sistema SHALL filtrar usuarios cuyo email contenga el término de búsqueda (ILIKE)

#### Scenario: Filtro por rol
- **WHEN** un admin solicita `GET /admin/users?role=Admin`
- **THEN** el sistema SHALL filtrar usuarios que tengan el rol especificado

#### Scenario: Incluir eliminados
- **WHEN** un admin solicita `GET /admin/users?include_deleted=true`
- **THEN** el sistema SHALL incluir usuarios con soft delete en los resultados

### Requirement: Obtener usuario por ID (admin)
El sistema SHALL proveer un endpoint `GET /admin/users/{id}` para ver detalles completos de un usuario.

#### Scenario: Usuario encontrado
- **WHEN** un admin solicita un ID de usuario existente
- **THEN** el sistema SHALL devolver todos los datos del usuario incluyendo roles, fecha de creación, y fecha de eliminación (si aplica)

#### Scenario: Usuario no encontrado
- **WHEN** un admin solicita un ID de usuario inexistente
- **THEN** el sistema SHALL devolver un error 404 (Not Found)

### Requirement: Actualizar roles de usuario
El sistema SHALL proveer un endpoint `PUT /admin/users/{id}/roles` para modificar los roles de un usuario.

#### Scenario: Roles actualizados exitosamente
- **WHEN** un admin envía una lista de nombres de roles válidos para un usuario existente
- **THEN** el sistema SHALL reemplazar los roles del usuario con la nueva lista y devolver el usuario actualizado

#### Scenario: Rol inválido
- **WHEN** un admin envía un nombre de rol que no existe en el sistema
- **THEN** el sistema SHALL devolver un error 422 indicando que el rol no es válido

### Requirement: Soft delete de usuario
El sistema SHALL proveer un endpoint `DELETE /admin/users/{id}` para realizar soft delete de un usuario.

#### Scenario: Soft delete exitoso
- **WHEN** un admin elimina un usuario existente no eliminado previamente
- **THEN** el sistema SHALL marcar `eliminado_en` con la fecha/hora actual y devolver el usuario actualizado

#### Scenario: Usuario ya eliminado
- **WHEN** un admin intenta eliminar un usuario ya eliminado
- **THEN** el sistema SHALL devolver un error 409 (Conflict) o 400 (Bad Request)

### Requirement: Restore de usuario
El sistema SHALL proveer un endpoint `POST /admin/users/{id}/restore` para restaurar un usuario con soft delete.

#### Scenario: Restore exitoso
- **WHEN** un admin restaura un usuario eliminado
- **THEN** el sistema SHALL poner `eliminado_en` en NULL y devolver el usuario restaurado

### Requirement: Frontend de gestión de usuarios
El sistema SHALL mostrar una página `/admin/users` con una tabla de usuarios y funcionalidad de gestión.

#### Scenario: Tabla de usuarios con paginación
- **WHEN** un Admin navega a `/admin/users`
- **THEN** el sistema SHALL mostrar una tabla paginada con columnas: nombre, email, roles, fecha de registro, acciones

#### Scenario: Búsqueda y filtros
- **WHEN** un Admin escribe en el campo de búsqueda o selecciona un filtro de rol
- **THEN** el sistema SHALL actualizar la tabla con los resultados filtrados

#### Scenario: Modal de edición de roles
- **WHEN** un Admin hace click en "Editar Roles" para un usuario
- **THEN** el sistema SHALL mostrar un modal/modal con checkboxes para seleccionar/deseleccionar roles y un botón para guardar

#### Scenario: Confirmación de eliminación
- **WHEN** un Admin hace click en "Eliminar" para un usuario
- **THEN** el sistema SHALL mostrar un diálogo de confirmación antes de ejecutar el soft delete

#### Scenario: Restore de usuario
- **WHEN** un Admin ve un usuario eliminado (con indicador visual) y hace click en "Restaurar"
- **THEN** el sistema SHALL restaurar el usuario y actualizar la tabla
