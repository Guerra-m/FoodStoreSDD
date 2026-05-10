## Context

El sistema ya tiene un modelo `Usuario` con autenticación JWT y RBAC. Los usuarios con rol "Cliente" pueden autenticarse pero no tienen perfil editable ni direcciones de entrega. El carrito de compras (change 7) y pedidos (change 8) dependen de tener clientes con direcciones.

Actualmente el endpoint `GET /me` devuelve los datos del usuario autenticado, pero no incluye direcciones ni permite editar el perfil.

## Goals / Non-Goals

**Goals:**
- Extender `Usuario` con campos de perfil opcionales (`foto_url`, `fecha_nacimiento`)
- Crear modelo `Direccion` con FK a `Usuario`, soporte para múltiples direcciones y una marcada como principal
- Endpoints CRUD para perfil del cliente autenticado (`GET /me`, `PATCH /me`)
- Endpoints CRUD para direcciones del cliente autenticado
- Frontend: página de perfil con formulario editable y sección de direcciones
- Seguir el patrón existente: Repository + Service + Router + Schema + Model

**Non-Goals:**
- Registro de clientes desde el frontend (ya existe vía auth)
- Dashboard admin de clientes (será en change 11)
- Geocodificación automática de direcciones
- Validación de direcciones contra servicios externos

## Decisions

| Decisión | Opción elegida | Alternativas | Razón |
|----------|---------------|--------------|-------|
| ¿Extender `Usuario` o crear `Cliente`? | Extender `Usuario` con campos opcionales | Crear tabla `Cliente` separada con 1:1 | Ya tenemos el usuario autenticado con JWT. Una tabla separada agregaría joins innecesarios para algo que es 1:1. Los campos nuevos son opcionales, no rompen nada existente. |
| ¿Direcciones como módulo separado o dentro de clientes? | Módulo separado `direcciones/` | Meterlo dentro de `usuarios/` | Sigue el patrón del proyecto (cada entidad tiene su propio módulo). La dirección es una entidad con su propio ciclo de vida. |
| ¿Múltiples direcciones? | Sí, con campo `es_principal` booleano | Una sola dirección por cliente | Un cliente puede querer entregar en su casa, trabajo, etc. Se valida que solo una sea principal por cliente. |
| ¿Soft delete en direcciones? | No, se eliminan físicamente | Soft delete | Las direcciones no tienen trazabilidad crítica. Si se eliminan, es porque el cliente ya no las usa. |
| ¿Frontend en página separada o integrada? | Página separada `MiPerfil.tsx` con tabs | Modal desde navbar | Es información suficiente para merecer su propia página con dos secciones (perfil + direcciones). |

## Risks / Trade-offs

- [Riesgo] **Extender `Usuario` con campos nuevos** → La migration altera una tabla existente con datos. Mitigación: los campos son `Optional` con `nullable=True`, no hay breaking change.
- [Riesgo] **Múltiples clientes pueden compartir dirección** → No es un problema hoy. Si futuros cambios requieren facturación, se puede normalizar después.
- [Trade-off] **No hay geocodificación** → Las direcciones se guardan como texto estructurado. Si en el futuro se necesita calcular rutas de delivery, se puede agregar lat/lng opcional.
