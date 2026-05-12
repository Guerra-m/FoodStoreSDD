## 1. Backend Implementation

- [x] 1.1 Crear el schema Pydantic ChangePasswordRequest con campos current_password y new_password (mínimo 8 caracteres)
- [x] 1.2 Agregar método change_password() en UserService que valide la contraseña actual con bcrypt.verify y hashee la nueva
- [x] 1.3 Agregar endpoint PUT /api/users/me/password en el router de usuarios, protegido con el dependency de usuario autenticado
- [x] 1.4 Retornar HTTP 400 si current_password no coincide, HTTP 200 con mensaje de éxito si todo está bien

## 2. Frontend Security

- [x] 2.1 Crear componente PrivateRoute que reciba prop allowedRoles[], lea el rol actual desde useAuthStore() y redirija a /unauthorized si el usuario no tiene el rol requerido
- [x] 2.2 Crear página /unauthorized con mensaje de acceso denegado y botón para volver al inicio
- [x] 2.3 Envolver las rutas protegidas existentes en el router con PrivateRoute usando los roles correspondientes por ruta
- [x] 2.4 Agregar interceptor de respuesta en el cliente Axios que capture 401 (logout automático + redirect a /login), 403 (toast "Sin permisos"), 422 (toast con mensaje de validación del servidor) y 500 (toast "Error interno del servidor")

## 3. Verification

- [x] 3.1 Test successful password change
- [x] 3.2 Test failed password change (incorrect password)
- [x] 3.3 Verify route redirection on unauthorized access
- [x] 3.4 Verify global error handling and auto-logout
