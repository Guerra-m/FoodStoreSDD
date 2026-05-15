# CHANGE 8: RBAC Authorization System

## 🎯 Propuesta para el Siguiente Cambio

### Opción Recomendada: RBAC Authorization

---

## 📋 OBJETIVOS DE CHANGE 8

1. ✅ Crear middleware de autorización por roles
2. ✅ Agregar roles como claims en JWT
3. ✅ Crear `require_roles()` dependency para proteger endpoints
4. ✅ Seed de roles: Cliente, Admin, Delivery
5. ✅ Asignar rol "Cliente" a nuevos usuarios en registro
6. ✅ Endpoints protegidos por rol (ej: /admin/*)
7. ✅ Tests exhaustivos de RBAC

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### Backend

```
backend/app/auth/
├── security.py ...................... Agregar roles claim en JWT
├── dependencies.py .................. Nuevo: require_roles()
├── services.py ...................... Agregar lógica de roles
└── routes.py ........................ Actualizar /auth/me y login response

backend/scripts/
└── seed.py .......................... Crear roles base

backend/tests/ (NUEVO)
└── test_auth_rbac.py ................ Tests de autorización
```

### Frontend

```
frontend/src/features/
├── auth/
│   ├── components/
│   │   └── ProfileCard.tsx (NUEVO) ... Mostrar rol del usuario
│   └── context/
│       └── AuthContext.tsx ........... Incluir roles en context
└── admin/ (NUEVO)
    └── AdminGuard.tsx (NUEVO) ........ Proteger rutas admin
```

---

## 🔧 CAMBIOS ESPECÍFICOS

### Backend - `app/auth/security.py`

- Agregar "roles" claim al JWT con lista de nombres de roles
- Función para extraer roles del token
- Validación de roles en token

### Backend - `app/auth/dependencies.py` (NUEVO)

```python
def require_roles(roles: List[str]) -> Callable:
    """
    Dependency que verifica que el usuario tenga al menos uno de los roles requeridos.
    Lanza 403 Forbidden si no autorizado.
    """
```

### Backend - `app/auth/services.py`

- Método: `assign_default_role_to_user(user_id)` 
- Asigna "Cliente" a nuevos usuarios en registro
- Incluir roles en LoginResponse
- Método para obtener roles del usuario

### Backend - `scripts/seed.py`

- Crear roles: "Cliente", "Admin", "Delivery" (idempotente)
- Ejecutar después de cada migración

### Backend - `tests/test_auth_rbac.py` (NUEVO)

- Tests de acceso permitido/denegado
- Tests de múltiples roles
- Tests de claims en JWT
- Tests de endpoints protegidos

### Frontend - `features/auth/context/AuthContext.tsx`

- Agregar campos: `userRoles: string[] = []`
- Incluir roles en `UserResponse`
- Método: `hasRole(role: string): boolean`
- Método: `isAdmin(): boolean`

### Frontend - `features/auth/components/ProfileCard.tsx` (NUEVO)

- Mostrar email y rol del usuario autenticado
- Botón Logout
- Botón Admin Dashboard (solo si isAdmin)
- Avatar del usuario

### Frontend - `features/admin/AdminGuard.tsx` (NUEVO)

- Componente wrapper para proteger rutas admin
- Redirige a home si no tiene rol "Admin"
- Muestra mensaje de acceso denegado

---

## 🔄 FLUJO DE CHANGE 8

```
Fase 1: Propuesta (openspec-propose)
└─ Crear change con proposal, design, specs, tasks

Fase 2: Implementación (openspec-apply-change)
├─ Backend RBAC
│  ├─ Crear require_roles() dependency
│  ├─ Agregar roles en JWT
│  ├─ Seed de roles
│  ├─ Asignar rol en registro
│  └─ Tests RBAC
└─ Frontend
   ├─ ProfileCard
   ├─ AdminGuard
   └─ Actualizar AuthContext

Fase 3: Archivado (openspec-archive-change)
└─ Sincronizar specs y cerrar change
```

---

## 💡 VENTAJAS DE ESTA OPCIÓN

✅ Complementa perfecto el JWT del Change 7
✅ Necesario para seguridad de endpoints administrativos
✅ Autocontendido (no requiere otros cambios)
✅ Sienta base para auditing, logging, permisos granulares
✅ Tamaño manejable (2-3 días de trabajo)
✅ Escalable para futuras mejoras

---

## 🚀 PRÓXIMOS CAMBIOS DESPUÉS DE CHANGE 8

- Change 9: Client State Management (Zustand + Axios)
- Change 10: Shopping Cart & Checkout
- Change 11: Order Management
- Change 12: Admin Dashboard
- Change 13: Payment Integration
- Change 14: Notifications
- Change 15: Reporting & Analytics

---

## ❓ ¿Qué Dicen?

¿Están listo para empezar **Change 8: RBAC Authorization System**?

O prefiere explorar una opción diferente:
- **Opción B:** Client State Management (Zustand + Axios)
- **Opción C:** Data Integrity (Unit of Work + Base Repository)
