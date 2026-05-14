## Why

Completada la layer 1 (shared/ → api/, hooks/, components/, stores/), el siguiente paso es liberar la carpeta `app/` moviendo sus contenidos a la raíz de `src/`. Esto alinea la estructura con la arquitectura target definida en `frontend-architecture`, donde las páginas viven en `pages/`, los componentes en `components/` y la configuración de rutas en `router/`.

## What Changes

- **Mover** `app/App.tsx` → `App.tsx` (raíz de src/)
- **Mover** `app/pages/*` y `app/pages/**/*` → `pages/` (incluyendo subcarpetas admin/ y auth/)
- **Mover** `app/components/*` y `app/components/**/*` → `components/` (incluyendo subcarpeta admin/)
- **Extraer** las definiciones de rutas de `App.tsx` → `router/index.tsx`
- **Simplificar** `App.tsx` para que solo monte `BrowserRouter`, `AuthProvider`, layout general y `<Routes>` importado desde `router/`
- **Actualizar** todos los imports afectados
- **Eliminar** la carpeta `app/` una vez vacía

## Capabilities

### New Capabilities

Ninguna. Este change no introduce nuevas capacidades — solo reestructura archivos existentes.

### Modified Capabilities

Ninguna. No cambian requerimientos funcionales.

## Impact

- **~20 archivos movidos** de `app/` a `pages/`, `components/` y raíz
- **1 archivo nuevo**: `router/index.tsx` con las rutas extraídas
- **`App.tsx` simplificado**: pasa de ~176 líneas a ~30, delegando rutas al router
- **Todos los imports** en archivos que referencian `app/` deben actualizarse
