## Why

El frontend actual mezcla responsabilidades en `shared/` (api, hooks, components, stores todo junto) sin una estructura clara. Esto dificulta la escalabilidad y el mantenimiento. La layer 1 es el primer paso para alinear el código con la arquitectura target definida en la skill `frontend-architecture`, separando `shared/` en carpetas con responsabilidad única.

## What Changes

- **Mover** `shared/api/` → `api/` (HTTP clients por recurso)
- **Mover** `shared/hooks/` → `hooks/` (custom hooks compartidos)
- **Mover** `shared/components/` → `components/` (componentes puramente visuales)
- **Mover** `shared/stores/` → `stores/` (stores de Zustand)
- **Actualizar** todos los imports afectados por los movimientos
- **Eliminar** la carpeta `shared/` una vez vacía

## Capabilities

### New Capabilities

Ninguna. Este change no introduce nuevas capacidades — solo reestructura archivos existentes.

### Modified Capabilities

Ninguna. No cambian requerimientos funcionales, solo la ubicación del código.

## Impact

- **~34 archivos movidos** de `shared/` a sus nuevas ubicaciones
- **Todos los imports** en pages, components, features, y otros archivos que referencien `shared/` deben actualizarse
- **Archivos afectados**: `app/pages/*`, `app/components/*`, `features/auth/*`, `features/shopping-cart/*`, y los propios archivos movidos
- No hay cambios en lógica de negocio, tipos, o comportamiento
