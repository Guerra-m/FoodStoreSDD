## 1. Modelos y Migración

- [x] 1.1 Extender `Usuario` con campos opcionales: `foto_url`, `fecha_nacimiento`
- [x] 1.2 Crear modelo `Direccion` con campos: id, usuario_id (FK), calle, numero, ciudad, provincia, codigo_postal, latitud (opcional), longitud (opcional), es_principal, creado_en, actualizado_en
- [x] 1.3 Crear migración Alembic manual con los cambios de schema

## 2. Backend — Repositorio de Direcciones

- [x] 2.1 Crear `DireccionRepository` con métodos: create, get_by_id, list_by_usuario, update, delete, set_principal
- [x] 2.2 Implementar lógica de unicidad de dirección principal por usuario

## 3. Backend — Servicios

- [x] 3.1 Extender `UsuarioService` o crear `ClienteService` con método `actualizar_perfil` que permita modificar nombre, teléfono, foto_url y fecha_nacimiento (no email)
- [x] 3.2 Crear `DireccionService` con validaciones: solo el dueño puede modificar/eliminar, no eliminar la única dirección principal sin reemplazo

## 4. Backend — Schemas y Routers

- [x] 4.1 Crear schemas Pydantic para perfil del cliente (ClientePerfilResponse, ClientePerfilUpdate)
- [x] 4.2 Crear schemas Pydantic para direcciones (DireccionCreate, DireccionResponse, DireccionUpdate)
- [x] 4.3 Agregar endpoint `PATCH /api/v1/clientes/perfil`
- [x] 4.4 Extender `GET /api/v1/usuarios/me` para incluir direcciones si el usuario es Cliente
- [x] 4.5 Crear router `direcciones.py` con endpoints CRUD: POST, GET (list), PUT {id}, DELETE {id}, PATCH {id}/principal
- [x] 4.6 Registrar routers en `main.py`

## 5. Backend — Tests

- [x] 5.1 Escribir tests para perfil: ver perfil propio, actualizar perfil, intentar cambiar email
- [x] 5.2 Escribir tests para direcciones: CRUD completo, marcar/desmarcar principal, eliminar dirección principal da error
- [x] 5.3 Escribir tests de autorización: cliente no puede ver/editar direcciones de otro cliente

## 6. Frontend — API Layer

- [x] 6.1 Crear `customerApi.ts` con métodos getProfile y updateProfile
- [x] 6.2 Crear `addressApi.ts` con métodos CRUD para direcciones

## 7. Frontend — Estado Global

- [x] 7.1 Crear `addressStore.ts` con Zustand: lista de direcciones, dirección seleccionada, loading/error states

## 8. Frontend — Hooks

- [x] 8.1 Crear `useCustomerProfile.ts` con operaciones de perfil
- [x] 8.2 Crear `useDirecciones.ts` con operaciones CRUD de direcciones

## 9. Frontend — Páginas y Componentes

- [x] 9.1 Crear página `MiPerfil.tsx` con secciones de perfil (editable) y direcciones
- [x] 9.2 Crear componente `AddressFormModal.tsx` para crear/editar dirección
- [x] 9.3 Crear componente `AddressCard.tsx` para mostrar dirección individual con acciones (editar, eliminar, marcar principal)
- [x] 9.4 Agregar ruta en el router de la app y enlace en la navegación
