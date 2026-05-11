## 1. Setup y Configuración

- [ ] 1.1 Verificar que tablas Role y usuarios_roles existen en BD
- [ ] 1.2 Revisar estructura de User model y relación con roles
- [ ] 1.3 Crear archivo backend/app/auth/roles.py con constantes de roles (CLIENTE, ADMIN, DELIVERY)

## 2. Backend - Actualizar JWT para incluir claims de roles

- [ ] 2.1 Modificar security.py: Función create_access_token() para incluir "roles" claim
- [ ] 2.2 Crear función extract_roles_from_token() en security.py para extraer roles del JWT
- [ ] 2.3 Crear función get_user_roles(user_id: int) que consulta BD para obtener roles del usuario
- [ ] 2.4 Tests: Verificar que JWT contiene roles claim con lista correcta

## 3. Backend - Crear require_roles() dependency

- [ ] 3.1 Crear función require_roles(roles: List[str]) en dependencies.py
- [ ] 3.2 Función debe extraer roles del JWT actual del usuario autenticado
- [ ] 3.3 Verificar que usuario tenga al menos uno de los roles requeridos
- [ ] 3.4 Lanzar HTTPException 403 si roles insuficientes
- [ ] 3.5 Tests: Verificar acceso permitido con rol correcto
- [ ] 3.6 Tests: Verificar acceso denegado sin rol correcto (403)

## 4. Backend - Seed de roles

- [ ] 4.1 Actualizar scripts/seed.py para crear roles base (Cliente, Admin, Delivery)
- [ ] 4.2 Implementar lógica idempotente (no crear si ya existen)
- [ ] 4.3 Ejecutar seed y verificar que 3 roles se crean correctamente
- [ ] 4.4 Tests: Verificar que seed es idempotente

## 5. Backend - Asignar rol por defecto en registro

- [ ] 5.1 Modificar AuthService.register() para asignar rol "Cliente" automáticamente
- [ ] 5.2 Crear relación en BD entre usuario y rol "Cliente" en tabla usuarios_roles
- [ ] 5.3 Verificar que usuario registrado tiene rol en BD
- [ ] 5.4 Tests: Verificar que nuevo usuario tiene rol "Cliente" en BD

## 6. Backend - Actualizar respuestas de autenticación

- [ ] 6.1 Modificar UserResponse schema para incluir campo "roles": List[str] (opcional con default [])
- [ ] 6.2 Modificar AuthService.login() para incluir roles en LoginResponse
- [ ] 6.3 Modificar AuthService.register() para incluir roles en respuesta
- [ ] 6.4 Modificar AuthService.refresh_token() para incluir roles en nuevo token y respuesta
- [ ] 6.5 Tests: Verificar que LoginResponse incluye "roles"

## 7. Backend - Actualizar endpoints protegidos

- [ ] 7.1 Actualizar POST /auth/register endpoint para reflejar cambios de service
- [ ] 7.2 Actualizar POST /auth/login endpoint para reflejar cambios de service
- [ ] 7.3 Actualizar POST /auth/refresh endpoint para reflejar cambios de service
- [ ] 7.4 Tests: Verificar endpoints devuelven roles en respuesta

## 8. Backend - Tests exhaustivos de RBAC

- [ ] 8.1 Crear archivo backend/tests/test_auth_rbac.py
- [ ] 8.2 Test: Login incluye roles en JWT claim
- [ ] 8.3 Test: Endpoint protegido permite acceso con rol requerido
- [ ] 8.4 Test: Endpoint protegido deniega acceso sin rol (403)
- [ ] 8.5 Test: Usuario con múltiples roles accede a endpoint que requiere uno de ellos
- [ ] 8.6 Test: Nuevo usuario tiene rol Cliente automáticamente
- [ ] 8.7 Test: JWT signature invalida si alguien modifica roles claim
- [ ] 8.8 Test: require_roles() rechaza usuario sin autenticación (401)
- [ ] 8.9 Test: Roles se actualizan en nuevo token después de refresh

## 9. Backend - Crear endpoints administrativos de ejemplo

- [ ] 9.1 Crear endpoint GET /admin/test que requiere rol "Admin"
- [ ] 9.2 Endpoint devuelve mensaje "Admin access granted"
- [ ] 9.3 Tests: Verificar que solo Admin puede acceder
- [ ] 9.4 Tests: Verificar que Cliente obtiene 403

## 10. Backend - Documentación

- [ ] 10.1 Agregar docstrings a todas las nuevas funciones
- [ ] 10.2 Crear AUTHORIZATION.md con guía de uso de require_roles()
- [ ] 10.3 Crear ejemplos de cómo proteger endpoints con roles
- [ ] 10.4 Documentar estructura de roles claim en JWT
- [ ] 10.5 Agregar comentarios en código sobre decisiones de diseño

## 11. Backend - Validación final

- [ ] 11.1 Ejecutar todos los tests y verificar 100% pass rate
- [ ] 11.2 Verificar que no hay breaking changes en endpoints existentes
- [ ] 11.3 Verificar que usuarios existentes (si los hay) pueden aún autenticarse
- [ ] 11.4 Limpiar console.logs y debug code
- [ ] 11.5 Code review: Verificar que no hay hardcoded secrets o credenciales
