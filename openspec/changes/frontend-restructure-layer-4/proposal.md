## Why

Tras los layers 1-3 de reestructura del frontend, la estructura base está en su lugar (`api/`, `components/`, `hooks/`, `pages/`, `router/`, `stores/`, `types/`). Sin embargo, quedan carpetas y archivos que no siguen la arquitectura target: `utils/` es una carpeta comodín que debe migrar a `lib/`, no existe `assets/` para recursos estáticos, y hay archivos stale en la raíz del proyecto que deben eliminarse. Este layer 4 es la **capa final de pulido** para dejar la estructura limpia y alineada con la arquitectura target.

## What Changes

- Crear `lib/` como directorio para utilidades puras (sin dependencias de UI o estado)
- Migrar `utils/auth.ts` → `lib/auth.ts` y actualizar sus 4 imports
- Eliminar `utils/` (queda vacía tras la migración)
- Crear `assets/` para recursos estáticos (imágenes, SVGs, etc.)
- Verificar que `types/` esté centralizado y completo
- Eliminar archivos stale de la raíz del proyecto (AUTHORIZATION.md, AUTH_README.md, CHANGE_8_*.md, SECURITY_VALIDATION.md)
- Limpiar cualquier carpeta vacía remanente

## Capabilities

### New Capabilities

*Ninguna. Este change es puramente estructural, no introduce nuevas capacidades de negocio.*

### Modified Capabilities

*Ninguna. No hay cambios en requerimientos de specs existentes — solo reorganización de archivos.*

## Impact

- **Frontend**: `utils/auth.ts` se mueve a `lib/auth.ts` — 4 archivos actualizan su import path
- **Raíz del proyecto**: 7 archivos stale eliminados
- **Sin impacto en backend, APIs, tests, o comportamiento**
- **Sin breaking changes funcionales**
