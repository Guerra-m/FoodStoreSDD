## 1. Configuración inicial y dependencias

- [x] 1.1 Agregar dependencias Python al backend: python-jose, bcrypt, pydantic-settings
- [x] 1.2 Agregar variable .env para JWT secret y duraciones (JWT_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS)
- [x] 1.3 Crear estructura de carpetas backend/app/auth/ (models.py, schemas.py, services.py, routes.py, security.py, dependencies.py)
- [x] 1.4 Crear estructura de carpetas frontend/src/features/auth/ (components, context, hooks, types, utils)

## 2. Backend - Modelos y base de datos

- [x] 2.1 Crear modelo SQLAlchemy User con campos (id, email, hashed_password, nombre, rol, createdAt, updatedAt)
- [x] 2.2 Crear modelo SQLAlchemy RefreshToken con campos (id, user_id, token_hash, expires_at, revoked_at, createdAt)
- [x] 2.3 Crear migraciones de BD para tablas users y refresh_tokens
- [x] 2.4 Ejecutar migraciones en BD local para verificar

## 3. Backend - Utilidades de seguridad

- [x] 3.1 Crear funciones en security.py: hash_password (bcrypt), verify_password, create_access_token, create_refresh_token
- [x] 3.2 Crear función generate_random_token para generar refresh tokens opacos (32+ bytes)
- [x] 3.3 Crear función verify_jwt_token para validar y deserializar JWT
- [x] 3.4 Agregar validaciones básicas: password_strength (mínimo 8 caracteres), email_format

## 4. Backend - Servicios de autenticación

- [x] 4.1 Crear AuthService.register() - valida entrada, crea usuario con password hasheado, retorna UserResponse
- [x] 4.2 Crear AuthService.login() - verifica credenciales, crea access + refresh token, almacena refresh en BD
- [x] 4.3 Crear AuthService.refresh_token() - valida refresh token, revoca antiguo, genera nuevo par, detecta robo
- [x] 4.4 Crear AuthService.logout() - marca refresh token como revocado
- [x] 4.5 Crear AuthService.get_current_user() - valida access token JWT, retorna usuario
- [x] 4.6 Agregar lógica de detección de robo: si refresh token revocado se usa, revocar todos los tokens del usuario

## 5. Backend - Rutas y endpoints

- [x] 5.1 Crear router auth con endpoint POST /auth/register (RegisterRequest → UserResponse)
- [x] 5.2 Crear endpoint POST /auth/login (LoginRequest → LoginResponse con access_token, refresh_token)
- [x] 5.3 Crear endpoint POST /auth/refresh (RefreshRequest → LoginResponse con nuevo par de tokens)
- [x] 5.4 Crear endpoint POST /auth/logout (LogoutRequest con refresh_token → 200 OK)
- [x] 5.5 Crear endpoint GET /auth/me - retorna usuario actual (requiere access token válido)
- [x] 5.6 Agregar dependency injection current_user en dependencies.py para proteger endpoints

## 6. Backend - Validación de seguridad

- [x] 6.1 Asegurar que passwords nunca se loguean o retornan en responses
- [x] 6.2 Validar que email es único antes de crear usuario (constraint en BD + validación en app)
- [x] 6.3 Implementar validación de formato de email
- [x] 6.4 Verificar que errores 401 no revelan si email existe o contraseña es inválida (respuesta genérica)
- [x] 6.5 Agregar CORS configuration para permitir requests desde frontend (especificar origin, no usar *)

## 7. Frontend - Setup y tipos

- [x] 7.1 Crear archivo types.ts con interfaces: User, AuthToken, LoginRequest, RegisterRequest, AuthContextType
- [x] 7.2 Crear utils.ts con helpers: saveTokens, getTokens, clearTokens, isTokenExpired
- [x] 7.3 Crear services/authApi.ts con funciones fetch para /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me

## 8. Frontend - Contexto de autenticación

- [x] 8.1 Crear AuthContext.tsx con estado (user, isLoading, error, isAuthenticated)
- [x] 8.2 Crear AuthProvider que expone login, register, logout, refreshToken, clearError
- [x] 8.3 Agregar efecto para verificar sesión existente al montar (call /auth/me si token existe)
- [x] 8.4 Implementar interceptor de refresh automático: si access token expira, usar refresh_token automáticamente
- [x] 8.5 Crear custom hook useAuth() para acceder al contexto desde componentes

## 9. Frontend - Componentes de autenticación

- [x] 9.1 Crear componente LoginForm.tsx con campos email/password, validación, submit, manejo de errores
- [x] 9.2 Crear componente RegisterForm.tsx con campos email/nombre/password/confirmPassword, validación, submit
- [x] 9.3 Crear componente ProtectedRoute.tsx que redirige a login si no autenticado
- [x] 9.4 Crear componente LogoutButton.tsx simple con onClick que llama logout y redirige

## 10. Frontend - Integración con rutas

- [x] 10.1 Crear página /login que renderiza LoginForm
- [x] 10.2 Crear página /register que renderiza RegisterForm
- [x] 10.3 Agregar AuthProvider en App.tsx (wrap de toda la app)
- [x] 10.4 Proteger rutas que requieren autenticación usando ProtectedRoute (ej: /dashboard, /checkout)
- [x] 10.5 Agregar redirección automática a /login si usuario intenta acceder sin autenticar

## 11. Validación e integración

- [x] 11.1 Testear flujo completo: registro → login → acceso a /auth/me → logout
- [x] 11.2 Testear que refresh token rotation funciona (modificar duraciones en .env para probar)
- [x] 11.3 Testear detección de robo: usar refresh token revocado, verificar que se revocan todos
- [x] 11.4 Testear errores: email duplicado, contraseña débil, credenciales inválidas
- [x] 11.5 Testear seguridad: verificar headers CORS, que passwords no se loguean, responses no revelan info sensible
- [x] 11.6 Testear en navegador: local storage limpio, cookies configuradas correctamente, sesión persiste en recarga

## 12. Documentación y cleanup

- [x] 12.1 Documentar estructura de carpetas en README.md
- [x] 12.2 Agregar ejemplos de uso en comentarios de código
- [x] 12.3 Crear archivo SECURITY.md con notas sobre autenticación (no loguear passwords, refresh token rotation, etc.)
- [x] 12.4 Limpiar console.logs de debugging
- [x] 12.5 Revisar que no hay credenciales en código (JWT secret debe venir de .env)
