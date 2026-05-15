## Why

La carpeta `features/` es un vestigio de la estructura anterior que ya no se alinea con la arquitectura target del frontend. Luego de las layers 1 y 2, tenemos las carpetas destino (`api/`, `hooks/`, `components/`, `types/`) pero el contenido de `features/` sigue encapsulado, forzando imports engorrosos y una jerarquía inconsistente. Este cambio completa la distribución del contenido de `features/` a su lugar definitivo, eliminando la ambigüedad estructural.

## What Changes

- Distribuir `features/auth/` → `api/`, `hooks/`, `components/`, `types/`, `context/`, `utils/`
- Distribuir `features/shopping-cart/` → `components/`, `hooks/`, `types/`
- Distribuir `features/admin/` → `types/`
- Eliminar la carpeta `features/` una vez migrado todo su contenido
- Actualizar TODOS los imports de la aplicación que referencien archivos dentro de `features/`

No hay cambios de comportamiento, lógica de negocio, ni APIs. Es puramente estructural.

## Capabilities

### New Capabilities

Ninguna. Este cambio no introduce nuevas capacidades, solo reubica archivos existentes.

### Modified Capabilities

Ninguna. Los requerimientos a nivel de spec no cambian — solo cambia la ubicación física de los archivos de implementación.

## Impact

- **Archivos movidos**: ~26 archivos (`.ts`, `.tsx`, `.css`, `.test.ts`)
  - `features/auth/` (14 archivos): componentes, hooks, servicios, contexto, types, utils, tests
  - `features/shopping-cart/` (8 archivos): componentes, hooks, types, tests
  - `features/admin/` (1 archivo): types
- **Imports afectados**: decenas de imports en toda la aplicación que referencian `features/` — en pages, componentes, stores, router
- **Sin impacto en backend, DB, APIs, o tests de integración**
- **Sin breaking changes funcionales**: la app debe compilar y funcionar exactamente igual después de la migración
