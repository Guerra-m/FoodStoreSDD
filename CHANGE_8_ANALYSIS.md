# Change 8: Análisis y Propuesta

## Estado Actual del Proyecto

### Cambios Completados (1-7)
1. ✅ Initial Scaffolding & Setup
2. ✅ Auth & RBAC System (modelos de Role, Usuario, UsuarioRole)
3. ✅ Category Management
4. ✅ Ingredient Management
5. ✅ Product Catalog Core
6. ✅ Customer Profile & Addresses
7. ✅ JWT Authentication System (Login, Register, Token Refresh)

### Especificaciones Sin Implementar
- `authorization` - Sistema RBAC con middleware
- `client-state-management` - Zustand stores + Axios interceptor
- `data-integrity` - Unit of Work y Base Repository (parcialmente)
- `infra-core` - Infraestructura base

---

## Opciones para Change 8

### Opción A: RBAC Authorization (RECOMENDADO) ⭐
**Especificación:** `authorization`
**Dependencia:** Change 7 (JWT Auth) - YA COMPLETADO
**Complejidad:** Media
**Duración Estimada:** 2-3 días

**Objetivos:**
1. Crear middleware de autorización por roles
2. Agregar roles como claims en JWT
3. Crear decoradores/dependencias para proteger rutas
4. Implementar seeding de roles (Cliente, Admin, Delivery)
5. Asociar usuario logueado con rol por defecto (Cliente)
6. Tests de autorización

**Archivos a Tocar:**
- Backend:
  - `backend/app/auth/security.py` - Funciones para claims de rol en JWT
  - `backend/app/auth/dependencies.py` - Nuevo: `require_roles()` dependency
  - `backend/app/auth/routes.py` - Actualizar para incluir roles en respuestas
  - `backend/app/auth/services.py` - Lógica de asignación de roles
  - `backend/scripts/seed.py` - Crear roles base (Cliente, Admin, Delivery)
  - Nuevos tests: `backend/test_auth_rbac.py`

**Por qué es ideal:**
- Complementa perfectamente el JWT Auth del Change 7
- Necesario para proteger endpoints administrativos
- Relativamente autocontendido
- Sentará base para futuros cambios (auditing, etc.)

---

### Opción B: Client State Management (Zustand + Axios)
**Especificación:** `client-state-management`
**Dependencia:** Change 7 (JWT Auth) - YA COMPLETADO
**Complejidad:** Media-Alta
**Duración Estimada:** 3-4 días

**Objetivos:**
1. Crear stores de Zustand para carrito, direcciones, usuarios
2. Implementar persistencia en LocalStorage
3. Configurar cliente Axios con interceptores
4. Manejo automático de refresh token en 401
5. Sincronización de estado entre tabs

**Archivos a Tocar:**
- Frontend:
  - `frontend/src/stores/` (nuevo directorio)
  - `frontend/src/stores/cartStore.ts`
  - `frontend/src/stores/addressStore.ts`
  - `frontend/src/api/axiosClient.ts` (nuevo)
  - `frontend/src/features/auth/context/AuthContext.tsx` - Actualizar para usar Axios

**Por qué es útil:**
- Mejora significativa en experiencia del usuario
- Necesario para cart y checkout flow
- Escalable para futuras funcionalidades

---

### Opción C: Data Integrity (Unit of Work + Base Repository)
**Especificación:** `data-integrity`
**Dependencia:** Scaffolding - PARCIALMENTE HECHO
**Complejidad:** Media
**Duración Estimada:** 2 días

**Objetivos:**
1. Revisar/mejorar implementación de Unit of Work
2. Mejorar BaseRepository genérico
3. Estandarizar soft delete
4. Tests de transaccionalidad

**Archivos a Tocar:**
- Backend:
  - `backend/app/core/unit_of_work.py` - Revisar/mejorar
  - `backend/app/core/base_repository.py` - Mejorar genéricos
  - Tests de integridad

---

## Recomendación Final

### Change 8: RBAC Authorization ⭐ RECOMENDADO

**Razones:**
1. ✅ Dependencia completada (JWT Auth listo)
2. ✅ Autocontendido (no requiere otros cambios)
3. ✅ Fundamental para seguridad de API
4. ✅ Sienta base para auditing y permisos granulares
5. ✅ Completa el flujo de auth comenzado en Change 7

**Flujo de Cambio 8:**
```
RBAC Authorization
├── Backend
│   ├── Crear require_roles() dependency
│   ├── Agregar roles claim en JWT
│   ├── Seed de roles (Cliente, Admin, Delivery)
│   ├── Asignar rol Cliente a nuevos usuarios
│   └── Tests RBAC
├── Frontend
│   ├── Mostrar rol en ProfileCard
│   ├── Condición para mostrar admin panel
│   └── Tests
└── Documentación
    ├── AUTHORIZATION.md
    ├── ROLES_AND_PERMISSIONS.md
    └── Tests guide
```

**Próximos Cambios (después de Change 8):**
1. Change 9: Client State Management (Zustand)
2. Change 10: Shopping Cart & Checkout
3. Change 11: Order Management
4. Change 12: Admin Dashboard
5. ...y más

---

## ¿Qué Hacemos?

Propongo iniciar **Change 8: RBAC Authorization System**

¿Estás de acuerdo con esta dirección, o prefieres otra opción?

Puedo proponer una alternativa si lo ves necesario.
