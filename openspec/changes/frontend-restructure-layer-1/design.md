## Context

El frontend actual tiene una carpeta `shared/` que agrupa 4 responsabilidades distintas: API clients (`shared/api/`), custom hooks (`shared/hooks/`), componentes visuales (`shared/components/`), y stores de Zustand (`shared/stores/`). La arquitectura target definida en `frontend-architecture` exige que cada responsabilidad tenga su propia carpeta raíz en `src/`.

No hay cambios de lógica, tipos, ni comportamiento — solo movimiento de archivos y actualización de imports.

## Goals / Non-Goals

**Goals:**
- Separar `shared/` en 4 carpetas raíz con responsabilidad única: `api/`, `hooks/`, `components/`, `stores/`
- Actualizar todos los imports del proyecto que referencien archivos dentro de `shared/`
- Eliminar la carpeta `shared/` al finalizar

**Non-Goals:**
- NO cambiar lógica de negocio, tipos, o comportamiento
- NO mover `features/` ni `app/` (eso es layer 2 y 3)
- NO crear archivos nuevos ni refactorizar código existente

## Decisions

| Decisión | Opción elegida | Alternativa | Razón |
|----------|---------------|-------------|-------|
| Prefijo de imports | `@/shared/X` → `@/X` | Dejar `@/shared/X` y crear alias | La skill target usa rutas directas. Consistencia con la arquitectura final. |
| Orden de migración | api → hooks → components → stores | Todo en paralelo | Evita conflictos: `stores/` depende de `hooks/` y `api/` conoce los tipos. Pero como NO hay cambios de lógica, se puede hacer secuencial por carpeta. |
| Manejo de tests | Dejar tests en `stores/tests/` y `hooks/tests/` dentro de la nueva ubicación | Mover tests a carpeta `tests/` separada | Mantener tests colocalizados con el código que prueban. Se re-evaluará en layer 4. |
| Archivo `axios.ts` | Se mueve a `api/axios.ts` | Dejarlo en `api/core/axios.ts` | Por ahora mantener estructura plana. Si crece, se extrae a `api/core/`. |

## Mapping de archivos

```
shared/api/                    →  api/
├── addressApi.ts              →  api/address.ts
├── adminApi.ts                →  api/admin.ts
├── axios.ts                   →  api/axios.ts
├── categoryApi.ts             →  api/categories.ts
├── customerApi.ts             →  api/customers.ts
├── ingredientApi.ts           →  api/ingredients.ts
├── orderApi.ts                →  api/orders.ts
├── pagoApi.ts                 →  api/pagos.ts
└── productApi.ts              →  api/products.ts

shared/hooks/                  →  hooks/
├── useCategories.ts           →  hooks/useCategories.ts
├── useCustomerProfile.ts      →  hooks/useCustomerProfile.ts
├── useDirecciones.ts          →  hooks/useDirecciones.ts
├── useIngredientes.ts         →  hooks/useIngredientes.ts
├── useMinDelay.ts             →  hooks/useMinDelay.ts
├── useOrders.ts               →  hooks/useOrders.ts
├── usePago.ts                 →  hooks/usePago.ts
├── useProducts.ts             →  hooks/useProducts.ts
├── useToast.ts                →  hooks/useToast.ts
└── tests/usePago.test.ts      →  hooks/tests/usePago.test.ts

shared/components/             →  components/
├── OrderSummaryCard.tsx       →  components/OrderSummaryCard.tsx
├── PaymentForm.tsx            →  components/PaymentForm.tsx
├── PaymentResultScreen.tsx    →  components/PaymentResultScreen.tsx
├── Skeleton.tsx               →  components/Skeleton.tsx
├── SkeletonCard.tsx           →  components/SkeletonCard.tsx
├── SkeletonDetail.tsx         →  components/SkeletonDetail.tsx
├── SkeletonTable.tsx          →  components/SkeletonTable.tsx

shared/stores/                 →  stores/
├── addressStore.ts            →  stores/addressStore.ts
├── authStore.ts               →  stores/authStore.ts
├── cartStore.ts               →  stores/cartStore.ts
├── categoryStore.ts           →  stores/categoryStore.ts
├── paymentStore.ts            →  stores/paymentStore.ts
├── productStore.ts            →  stores/productStore.ts
├── uiStore.ts                 →  stores/uiStore.ts
└── tests/paymentStore.test.ts →  stores/tests/paymentStore.test.ts
```

## Riesgos / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| **Import olvidado**: un archivo sigue importando desde `@/shared/X` y se rompe en build | Hacer `grep -r "@/shared"` al final para verificar que NO queden referencias |
| **Tests rotos**: los tests tienen imports relativos o referencias a `shared/` | Ejecutar `npm test` después del movimiento |
| **Git history perdido**: al mover archivos se pierde el blame history | Usar `git mv` en vez de copy+delete para preservar history |
| **Componente roto**: un import autogenerado por el IDE no se actualiza | Hacer build (`npm run build`) para detectar errores de compilación |

## Open Questions

- ¿El archivo `axios.ts` (instancia de Axios configurada) se queda en `api/axios.ts` o va a `api/core/axios.ts`? → Decidido: `api/axios.ts` por ahora.
- ¿Renombramos los archivos al moverlos (ej. `addressApi.ts` → `address.ts`)? → Decidido: sí, el nombre del recurso es suficiente. La carpeta `api/` ya indica que es un API client.
