## Context

El frontend fue reestructurado en 3 layers previos que movieron el código de `app/`, `features/`, y `shared/` a las carpetas target (`api/`, `components/`, `hooks/`, `pages/`, `router/`, `stores/`, `types/`). Sin embargo, quedan estos puntos pendientes:

- `utils/` sobrevive con un solo archivo (`auth.ts`) —Conceptualmente las utilidades puras pertenecen a `lib/`
- No existe `assets/` para recursos estáticos (imágenes, fuentes, SVGs)
- Hay 7 archivos stale en la raíz del proyecto (AUTHORIZATION.md, AUTH_README.md, CHANGE_8_*.md, SECURITY_VALIDATION.md) que son vestigios de cambios anteriores
- La carpeta `utils/` quedará vacía tras migrar su contenido y debe eliminarse

## Goals / Non-Goals

**Goals:**
- Migrar `utils/auth.ts` → `lib/auth.ts` con actualización de imports
- Eliminar carpeta `utils/` (vacía tras migración)
- Crear `assets/` para recursos estáticos
- Verificar que `types/` centralizado esté completo
- Remover los 7 archivos stale de la raíz
- Dejar la estructura frontend 100% alineada con la arquitectura target

**Non-Goals:**
- NO cambiar lógica de negocio ni comportamiento
- NO modificar componentes, hooks, stores, API modules
- NO renombrar funciones, variables, o tipos
- NO cambiar la estructura de `backend/`

## Decisions

| Decisión | Opción elegida | Alternativa | Razón |
|----------|---------------|-------------|-------|
| Nombre del directorio de utilidades | `lib/` | `helpers/`, `utilities/` | Sigue el estándar de la industria (Vite, React, Angular usan `lib/` para código puro sin UI) |
| Migración directa vs rename con barrel | Migración directa archivo por archivo | Barrel (`lib/index.ts`) | Solo hay 1 archivo y 4 imports, un barrel agrega complejidad innecesaria |
| Eliminación de `utils/` | Manual post-migración | `git rm -r utils/` | La carpeta queda vacía automáticamente tras mover el archivo; confirmar con `git status` |

## Risks / Trade-offs

- **[Bajo] Imports rotos si se omite algún archivo** → Los 4 imports fueron identificados con grep. Se verifica con `npm run build` post-migración.
- **[Bajo] `utils/` no se elimina automáticamente en git** → `git rm -r frontend/src/utils/` después de mover el archivo.
- **[Muy bajo] Assets agrega una carpeta vacía** → Se crea con un `.gitkeep` para mantenerla en el repo.
