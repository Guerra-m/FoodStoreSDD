## Context

Sistema de autenticación JWT ya implementado en Change 7. Usuarios se autentican y reciben access token, pero actualmente no hay control de acceso basado en roles. Modelos de Role y UsuarioRole ya existen en la base de datos (definidos en `app/modules/usuarios/model.py`). Necesitamos conectar estos modelos existentes con el sistema JWT para agregar RBAC.

**Estado Actual:**
- Access token JWT generado sin claims de roles
- No hay middleware para validar roles
- Tablas Role y usuarios_roles existen pero no se populan
- No hay endpoints administrativos protegidos

## Goals / Non-Goals

**Goals:**
1. Incluir roles del usuario como claim "roles" en JWT
2. Crear dependencia `require_roles(roles: List[str])` para proteger endpoints
3. Implementar seed de roles (Cliente, Admin, Delivery)
4. Asignar rol "Cliente" automáticamente a nuevos usuarios
5. Actualizar endpoints de auth para incluir roles en respuestas
6. Documentar patrones de uso
7. Agregar tests exhaustivos de RBAC

**Non-Goals:**
- Permisos granulares (eso es futura mejora)
- Cambios en BD (tablas ya existen)
- Cambios en frontend (eso es Change 9)
- Auditing o logging de cambios de roles (futura mejora)
- 2FA/MFA (futura)

## Decisions

### 1. Roles como lista en JWT claim "roles"
**Decision:** Incluir lista de nombres de roles en claim "roles" del JWT
**Rationale:** 
- Permite validación client-side sin llamadas adicionales
- Estándar en la industria (OAuth2/OIDC)
- Escalable para permisos granulares futuros
**Alternative:** Almacenar solo role_id (menos útil, requiere lookups)

### 2. Dependencia `require_roles()` en lugar de decorador
**Decision:** Usar FastAPI Depends injection pattern
**Rationale:**
- Consistente con `get_current_user()` existente
- Composable (puedes combinar múltiples dependencias)
- Type-safe
- Fácil de testear
**Alternative:** Decorador custom (menos flexible)

### 3. Rol por defecto "Cliente" en registro
**Decision:** Asignar automáticamente durante `AuthService.register()`
**Rationale:**
- No requiere tabla pivot o lógica especial
- Todos los usuarios del sistema tienen rol
- Cliente es rol más restrictivo (seguro por default)
**Alternative:** Requerer input de rol (no seguro, requiere validación extra)

### 4. Seed idempotente de roles
**Decision:** Script que verifica si roles existen antes de crear
**Rationale:**
- Seguro ejecutar múltiples veces (migraciones, deploys)
- No crea duplicados
- Compatible con CI/CD
**Alternative:** Migración de Alembic (más pesada para datos base)

### 5. Claims en JWT vs. obtener de BD
**Decision:** Incluir roles en JWT claim (no hacer lookup en BD)
**Rationale:**
- Reduce latencia (no requiere DB query)
- JWT es autosuficiente para validación
- Claims se validan en firma JWT
**Trade-off:** Si roles cambian, usuario debe refrescar token

### 6. Lista de roles mutable vs. constante
**Decision:** Extraer roles dinámicamente en cada login/refresh
**Rationale:**
- Si roles cambian, se refleja en próximo token
- No requiere invalidar tokens activos
- Más seguro
**Trade-off:** Pequeño costo de DB lookup en login/refresh

## Risks / Trade-offs

### [Risk] Token contiene roles estáticos
**Mitigation:** Token se renueva cada 15 minutos; cambios de rol se reflejan en próximo refresh. Para cambios urgentes, invalidar todos los tokens del usuario.

### [Risk] Alguien modifica payload del JWT localmente
**Mitigation:** JWT tiene firma HMAC-SHA256. Cliente no puede modificar claims sin invalidar firma. Server siempre valida firma antes de confiar en roles.

### [Risk] Olvidar proteger nuevo endpoint administrativo
**Mitigation:** Documentación clara con ejemplos. Code review checklist. Tests automáticos de RBAC.

### [Risk] Performance de lookup de roles en BD
**Mitigation:** Roles son pocos (3-5) y tabla pequeña. Operación O(1) con índice en usuario_id. Cache si se vuelve bottleneck.

## Migration Plan

**Step 1:** Agregar "roles" claim a JWT (backward compatible - usuarios sin roles obtienen lista vacía)
**Step 2:** Crear `require_roles()` dependency
**Step 3:** Ejecutar seed de roles (idempotente)
**Step 4:** Asignar rol "Cliente" a nuevos usuarios (próximos registros)
**Step 5:** Asignar rol "Cliente" a usuarios existentes (script de migración de datos)
**Step 6:** Proteger endpoints administrativos con `require_roles(["Admin"])`
**Step 7:** Tests y validación
**Step 8:** Documentación

**Rollback:** Si algo falla, la dependencia es solo lectura (no modifica datos). Revert código + volver a generar tokens.

## Open Questions

1. ¿Usuarios pueden tener múltiples roles? Sí, tabla usuarios_roles lo permite.
2. ¿Validamos roles en client-side también? Sí, para UX (pero server siempre valida).
3. ¿Logs de cambios de roles? Futura mejora (Change 11 o 12).
4. ¿Permisos granulares por rol? Futura mejora (Change 10 o 11).
