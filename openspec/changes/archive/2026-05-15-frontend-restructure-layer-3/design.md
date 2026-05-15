## Context

El frontend ha sido reestructurado en 2 layers previas:
- **Layer 1**: Movió `shared/api/` → `api/`, `shared/hooks/` → `hooks/`, `shared/components/` → `components/`, `shared/stores/` → `stores/`
- **Layer 2**: Movió `app/pages/` → `pages/`, `app/components/` → `components/`, extrajo el router a `router/index.tsx`

Actualmente queda la carpeta `features/` con 3 submódulos (`auth/`, `shopping-cart/`, `admin/`) cuyo contenido debe distribuirse a las carpetas destino ya existentes. No hay cambios de comportamiento, solo de ubicación e imports.

## Goals / Non-Goals

**Goals:**
- Eliminar completamente la carpeta `features/` distribuyendo su contenido
- Mover cada archivo a su ubicación definitiva según su tipo (component, hook, api, type, etc.)
- Actualizar todos los imports de la aplicación para que apunten a las nuevas ubicaciones
- Mantener la aplicación compilando y funcionando exactamente igual

**Non-Goals:**
- No se refactoriza lógica ni se cambia comportamiento
- No se modifican estilos, interfaces, ni APIs
- No se toca backend, stores, ni páginas (salvo imports)
- No se introducen nuevas dependencias

## Decisions

### 1. Mapeo `features/auth/` → destino definitivo

| Origen | Destino | Razón |
|--------|---------|-------|
| `features/auth/services/authApi.ts` | `api/authApi.ts` | Los servicios REST pertenecen a `api/`, junto a `api/admin.ts`, `api/orders.ts`, etc. |
| `features/auth/hooks/useAuth.ts` | `hooks/useAuth.ts` | Los hooks de negocio ya tienen su lugar en `hooks/` |
| `features/auth/components/*.tsx` | `components/auth/*.tsx` | Los componentes de UI van a `components/auth/` — colocation por submódulo |
| `features/auth/components/*.module.css` | `components/auth/*.module.css` | Los estilos acompañan a su componente |
| `features/auth/context/AuthContext.tsx` | `context/AuthContext.tsx` | Se crea `context/` como carpeta de primer nivel para contextos React |
| `features/auth/types.ts` | `types/auth.ts` | Los tipos compartidos van a `types/` (actualmente vacío) |
| `features/auth/utils.ts` | `utils/auth.ts` | Utilidades van a `utils/` |
| `features/auth/tests/*` | `hooks/tests/` o `components/tests/` según corresponda | Los tests acompañan al código que testean |

### 2. Mapeo `features/shopping-cart/` → destino definitivo

| Origen | Destino | Razón |
|--------|---------|-------|
| `features/shopping-cart/components/*.tsx` | `components/shopping-cart/*.tsx` | Colocation por submódulo en components/ |
| `features/shopping-cart/hooks/useCartCrossTabSync.ts` | `hooks/useCartCrossTabSync.ts` | Hook de negocio en hooks/ |
| `features/shopping-cart/types.ts` | `types/shopping-cart.ts` | Tipos compartidos en types/ |
| `features/shopping-cart/tests/cartStore.test.ts` | `stores/tests/cartStore.test.ts` | Testea el store, debe vivir con él |
| `features/shopping-cart/tests/cartStore.integration.test.ts` | `stores/tests/cartStore.integration.test.ts` | Testea el store, debe vivir con él |

### 3. Mapeo `features/admin/` → destino definitivo

| Origen | Destino | Razón |
|--------|---------|-------|
| `features/admin/types.ts` | `types/admin.ts` | Tipos compartidos en types/ |

### 4. Estrategia de actualización de imports

Para evitar errores de compilación, se actualizarán los imports en este orden:

1. **Mover archivos** a sus nuevas ubicaciones (los archivos originales dejan de existir)
2. **Actualizar imports** en cada archivo que referencie `features/` — buscando con grep todas las ocurrencias
3. **Verificar compilación** con `tsc --noEmit` o `npm run build`
4. **Eliminar** la carpeta `features/` vacía

### 5. Manejo de `context/` vs `stores/`

`AuthContext.tsx` usa React Context puro (no Zustand), por lo que merece su propia carpeta `context/` a nivel raíz, en lugar de mezclarlo en `stores/` que contiene estados globales con Zustand. Esto mantiene la separación de concerns: Zustand para estado global, React Context para proveer contexto de autenticación al árbol de componentes.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| **Import olvidado**: algún archivo queda con import a `features/` que ya no existe | Usar `grep -r "features/"` post-migración para confirmar cero ocurrencias |
| **Merge conflict**: si hay cambios sin commit en archivos de features/ | Asegurarse de que el working tree esté limpio antes de empezar |
| **Tests rotos**: los paths de imports en tests apuntan a ubicaciones antiguas | Buscar y actualizar imports también en archivos `.test.ts` |
| **Múltiples submódulos en components/**: `components/auth/` y `components/shopping-cart/` pueden tener nombres de archivo duplicados | Verificar previamente que no haya colisiones de nombres (no las hay: `LoginForm` vs `CartDrawer` no compiten) |
