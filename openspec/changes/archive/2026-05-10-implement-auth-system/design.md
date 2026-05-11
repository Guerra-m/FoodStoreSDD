## Context

El proyecto Food Store es una aplicación e-commerce con backend en FastAPI y frontend en React. Actualmente no tiene sistema de autenticación implementado. Necesitamos crear un sistema seguro que cumpla con las historias de usuario US-001 (Registro) y US-002 (Login), usando JWT para access tokens y refresh tokens opacos con rotación para máxima seguridad.

El spec `user-auth` define los requisitos detallados: registro con email único, login con JWT, refresh token rotation para detectar robos, logout, y obtención de perfil de usuario actual.

## Goals / Non-Goals

**Goals:**
- Implementar endpoints seguros de autenticación (registro, login, refresh, logout) en FastAPI
- Crear interfaz de usuario segura en React con formularios de registro e inicio de sesión
- Usar JWT para access tokens y refresh tokens opacos para máxima seguridad
- Detectar y mitigar robos de refresh tokens mediante rotación forzada
- Almacenar y validar credenciales de forma segura con bcrypt
- Mantener sesión del usuario en el frontend mediante context/store global
- Integrar autenticación con el flujo de la aplicación (redirección a login, protección de rutas)

**Non-Goals:**
- Autenticación multi-factor (MFA)
- Integración con proveedores OAuth (Google, GitHub, etc.)
- Recuperación de contraseña o reset por email
- Autenticación basada en roles avanzada (eso es authorization, cubierto por otro spec)
- Audit logging detallado de intentos de autenticación (puede agregarse después)

## Decisions

### Decision 1: Usar JWT + Refresh Token Rotation
**Chosen**: Access token JWT de corta duración + refresh token opaco con rotación
**Alternatives Considered:**
- Solo JWT sin refresh: Riesgo de tokens comprometidos con larga duración. Vulnerables a ataques XSS.
- Solo refresh tokens: Requiere más llamadas a BD. Más complejo.
- Sessions con cookies: Vulnerable a CSRF sin protecciones adicionales. Menos flexible para SPAs.

**Rationale**: JWT es estándar en SPAs, pero duraciones cortas limitan riesgo. Refresh tokens opacos se almacenan en BD y pueden revocarse. La rotación fuerza la revocación de todos los tokens si uno es robado. Detecta compromiso inmediatamente.

### Decision 2: Refresh Token como String Opaco (no JWT)
**Chosen**: Refresh token como string aleatorio de 32+ bytes, almacenado como SHA256 en BD
**Alternatives Considered:**
- Refresh token también como JWT: Válido pero requiere verificación de firma. Más overhead.
- UUID: Más corto, funciona, pero menos seguro que string aleatorio de 32 bytes.

**Rationale**: Opacos son más seguros porque no revelan información del usuario. No necesitamos deserializarlos en el cliente. SHA256 en BD es estándar y rápido. Token en memoria del cliente se envía al servidor, que valida contra hash.

### Decision 3: Almacenar tokens en memory/state (no localStorage)
**Chosen**: Access token en useState de React, refresh token en httpOnly cookie (si es posible) o estado seguro
**Alternatives Considered:**
- localStorage: Vulnerable a XSS. Si algún script obtiene acceso, roba los tokens.
- sessionStorage: Igual riesgo que localStorage.
- Cookies httpOnly: Más seguro pero más complejo de manejar CORS.

**Rationale**: Para esta fase, almacenamos access token en estado (volatil, se pierde al refresh). Refresh token en httpOnly cookie si CORS lo permite, o estado con ciertos riesgos aceptados. El usuario debe re-autenticarse si recarga. Podemos mejorar con httpOnly cookies después.

### Decision 4: Validación de Email Único en Base de Datos
**Chosen**: Constraint UNIQUE en columna `email` de tabla `users`, con validación previa de formato
**Alternatives Considered:**
- Validar duplicado solo en aplicación: Vulnerable a race conditions en múltiples instancias.
- Constraint pero sin validación previa: Más lento (rechaza en BD). Peor UX.

**Rationale**: Constraint en BD garantiza integridad incluso con race conditions. Validación previa en FastAPI mejora UX con errores claros. Combinación es robusta.

### Decision 5: Estructura de Carpetas Backend
**Chosen**: 
```
backend/app/auth/
  ├── models.py       # User, RefreshToken models SQLAlchemy
  ├── schemas.py      # Pydantic schemas (RegisterRequest, LoginResponse, etc.)
  ├── services.py     # AuthService (registro, login, refresh, logout)
  ├── routes.py       # Routers FastAPI
  ├── security.py     # Utilidades (hash, verify, crear JWT, etc.)
  └── dependencies.py # Dependency injection (current_user)
```

**Alternatives Considered:**
- Flat structure: Difícil de mantener con crecimiento.
- Monolítico en routes.py: Lógica mezclada, difícil de testear.

**Rationale**: Separación clara de responsabilidades. Modular, escalable, fácil de testear. Sigue patrones FastAPI estándar.

### Decision 6: Estructura de Carpetas Frontend
**Chosen**:
```
frontend/src/features/auth/
  ├── components/
  │   ├── LoginForm.tsx
  │   ├── RegisterForm.tsx
  │   └── ProtectedRoute.tsx
  ├── context/
  │   └── AuthContext.tsx         # Context + Provider con estado global
  ├── hooks/
  │   ├── useAuth.ts               # Hook para acceder a contexto
  │   └── useAuthApi.ts            # Hook para llamadas a API de auth
  ├── types.ts                     # TypeScript interfaces (User, AuthToken, etc.)
  └── utils.ts                     # Helpers (guardar/limpiar tokens, etc.)
```

**Alternatives Considered:**
- Zustand o Redux: Overkill para estado simple de autenticación.
- Props drilling: Difícil de mantener.

**Rationale**: Context API de React es suficiente para autenticación. Menos dependencias, más simple. Si la aplicación crece, puede refactorizarse a Zustand después.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| XSS en frontend roba access token | Access token de corta duración (15 min). Si se roba, daño limitado. Refresh en httpOnly cookie cuando sea posible. Auditoría de dependencias npm. |
| Refresh token robado antes de rotación | Rotación inmediata en next login/refresh. Si cliente detecta que su token fue revocado, re-autentica. Logs/alertas de revocación masiva. |
| Rate limiting en registro/login | No implementado aún. Vulnerable a fuerza bruta. Agregar rate limiting (redis o memoria) en próxima iteración. |
| Contraseñas débiles | Validación básica de longitud mínima (8 caracteres). Considerar ZXCVBN en futuro. |
| Contraseña en logs | Nunca logear contraseñas. Validar que no aparezcan en traces. |
| CORS permitir credenciales | Si CORS permite `credentials: include`, cuidado con wildcard `*`. Usar origin específico. |

## Migration Plan

1. **Fase 1 - Backend**: Crear modelos, servicios y rutas de auth en FastAPI. Crear tablas `users` y `refresh_tokens` en BD.
2. **Fase 2 - Frontend**: Crear componentes de login/registro, contexto de autenticación, integrar con API.
3. **Fase 3 - Validación**: Testear flujos completos (registro, login, refresh, logout) en ambas plataformas.
4. **Fase 4 - Rollout**: Desplegar backend primero, luego frontend. No hay breaking changes en APIs existentes (solo se agregan nuevos endpoints).

**Rollback**: Si hay problemas, revertir commits y restaurar BD a snapshot anterior. No hay migración de datos para el usuario existente (solo nuevos usuarios registrados).

## Open Questions

- ¿Debemos soportar login de usuarios existentes en BD con contraseña por defecto? (Para migración de usuarios legacy)
- ¿Qué duraciones usar para access token (15 min) y refresh token (7 días)? ¿Son aceptables?
- ¿Debemos implementar verificación de email (send link) o es opcional por ahora?
- ¿Se requiere 2FA o es fase posterior?
