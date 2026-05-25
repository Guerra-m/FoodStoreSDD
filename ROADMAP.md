# Mapa de Changes: Food Store SDD

**Status Actual (2026-05-25)**
- ✅ **Change 20 (fix-session-loop)**: COMPLETADO y VALIDADO
  - Session loop bug: ARREGLADO
  - Frontend productos: CARGANDO correctamente
  - Login/Logout: SIN ERRORES
  - 401 guards: IMPLEMENTADO
  - Backend startup: OK
  
- 🔜 **Change 21 (order-tracking-realtime)**: PRÓXIMO BLOQUEANTE
  - Requiere: Websockets + Real-time updates + Client dashboard
  - Dependencias: Change 20 ✅ + order-fsm ✅
  - Impacto: UX crítico para cliente

---

| Ord | Change (kebab-case) | Funcionalidad | Historias de Usuario (US) | Dependencias | Status | ¿Por qué? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `infra-setup-and-patterns` | Scaffolding monorepo, config backend (FastAPI), frontend (React/Vite/Tailwind), DB (Alembic/Seed), y patrones core (UoW, BaseRepo, Global Error Handler). | US-000, 000a, 000b, 000c, 000d, 000e, 068, 074 | Ninguna | Es la fundación. Sin los patrones BaseRepo y UoW, el resto del código sería inconsistente. |
| 2 | `auth-and-rbac-system` | Registro, Login (JWT), Refresh Token (con rotación en BD), Logout, Middleware de Autorización por Roles, protección de rutas frontend por rol y manejo global de errores en frontend. | US-001, 002, 003, 004, 005, 006, 073, 075, 076 | infra-setup-and-patterns | Necesitamos saber QUIÉN opera para aplicar reglas de negocio y proteger rutas. |
| 3 | `category-hierarchy` | Gestión de categorías jerárquicas con CTE recursiva para el árbol de navegación. | US-007, 008, 009, 010 | auth-and-rbac-system | Los productos dependen de las categorías. Sin esto, el catálogo no tiene estructura. |
| 4 | `ingredient-management` | CRUD de ingredientes y sistema de marcado de alérgenos. | US-011, 012, 013, 014 | auth-and-rbac-system | Información crítica para la seguridad alimentaria y detalle de productos. |
| 5 | `product-catalog-core` | CRUD de productos, asociación con categorías/ingredientes, gestión manual de stock y catálogo público con filtros. | US-015, 016, 017, 018, 019, 020, 021, 022, 023 | category-hierarchy, ingredient-management | Es el corazón del negocio. El producto es la unidad de venta. |
| 6 | `customer-profile-and-addresses` | Gestión de perfil de usuario y CRUD de direcciones de entrega (con lógica de dirección principal). | US-061, 062, 063, 024, 025, 026, 027, 028 | auth-and-rbac-system | Para crear un pedido, el cliente necesita definir dónde se entrega. |
| 7 | `shopping-cart-persistence` | Lógica de carrito client-side con Zustand, persistencia en LocalStorage y personalización (exclusión de ingredientes). | US-029, 030, 031, 032, 033, 034 | product-catalog-core | Prepara la "intención de compra" antes de persistir el pedido. |
| 8 | `order-creation-atomic` | Creación de pedidos atómica (UoW), validación de stock (Select for Update), generación de snapshots (precio/dirección) e historial inicial. | US-035, 036, 037, 038, 069, 070 | product-catalog-core, customer-profile-and-addresses, shopping-cart-persistence | La operación más compleja. Requiere integridad total para no perder guita ni stock. |
| 9 | `order-fsm-and-trazability` | Máquina de estados del pedido (FSM), transiciones permitidas, audit trail append-only y actualización de stock (confirmación/cancelación). | US-039, 040, 041, 042, 043, 044 | order-creation-atomic | Controla el flujo operativo y garantiza que nadie saltee estados (ej. de pendiente a entregado). |
| 10 | `mercadopago-integration` | Integración con Checkout API, creación de preferencias, procesamiento de Webhooks (IPN) e idempotencia de pagos. | US-045, 046, 047, 048 | order-fsm-and-trazability | Cierra el ciclo comercial permitiendo el cobro real. |
| 11 | `admin-dashboard-metrics` | Panel de administración con métricas globales, gráficos (recharts) y gestión avanzada de usuarios/roles. | US-049, 050, 051, 052, 053, 054, 055, 056, 057, 058, 059, 060, 064, 065 | order-fsm-and-trazability, auth-and-rbac-system | Visibilidad del negocio para el dueño y control total de la plataforma. |
| 12 | `ui-ux-refinement` | Pulido final: skeletons, toasts, confirmación visual de pedido creado y feedback de retorno de MercadoPago. | US-066, 067, 071, 072 | Todos los anteriores | Hace que la aplicación se sienta profesional y no un "trabajo práctico" de facultad. |
| 13 | `frontend-restructure-layer-1` | Mover `shared/api/` → `api/`, `shared/hooks/` → `hooks/`, `shared/components/` → `components/`, `shared/stores/` → `stores/` + actualizar imports. | — | ui-ux-refinement | Primera capa de reestructura del frontend para alinear con la arquitectura target. |
| 14 | `frontend-restructure-layer-2` | Mover `app/pages/` → `pages/`, `app/components/` → `components/`, extraer router de App.tsx a `router/index.tsx` + actualizar imports. | — | layer-1 | Segunda capa: páginas y routing en su lugar. |
| 15 | `frontend-restructure-layer-3` | Distribuir `features/auth/`, `features/shopping-cart/` y `features/admin/` en `api/`, `hooks/`, `components/`, `types/` + actualizar imports. | — | layer-2 | Tercera capa: eliminar la carpeta features/ distribuyendo su contenido. |
| 16 | `frontend-restructure-layer-4` | Crear `lib/`, `assets/`, `types/` centralizado, mover utilidades sueltas, limpiar carpetas vacías (`app/`, `features/`, `shared/`). | — | layer-3 | Capa final: pulir la estructura y eliminar lo obsoleto. |
| 17 | `auth-session-persistence` | Fix de persistencia de sesión: navegación SPA con `<Link>`, restore session con loading state, unificación de fuentes de verdad para tokens, y refresh automático en 401. | — | auth-and-rbac-system | La sesión se pierde al navegar entre páginas porque los links usan `<a href>` (full reload), el restoreSession no tiene estado de loading y las fuentes de verdad de tokens están inconsistentes. |
| 18 | `user-profile-and-auth-consolidation` | Edición de perfil de usuario desde el frontend, corrección del type `User` (rol → roles), consolidación del sistema de auth (usar nuevo `/api/v1/auth/*`), y fix del authStore con tipado fuerte. | US-062, 063 | auth-and-rbac-system, auth-session-persistence | El perfil de usuario no se puede editar porque falta el endpoint PATCH /me. El type User está desactualizado con `rol: string`. Conviven dos sistemas de auth (viejo y nuevo) causando inconsistencia. El authStore usa `any`. |
| 19 | `landing-page` | Landing page pública (`/`) con 6 secciones (Navbar, Hero, About, Featured Products, How It Works, Contact) con scroll navigation. Punto de entrada sin requerir autenticación. | — | auth-and-rbac-system | Presentar el Food Store a usuarios no autenticados antes de login. Actualmente la app va directo a login sin mostrar la marca. |
| 20 | `fix-session-loop` | Arreglar loop de sesión expirada: refresh token fallando (401), restoreSession sin guardia, logout incompleto. Unificar fuentes de verdad (localStorage vs Zustand), debounce refresh, mejorar interceptor axios. | — | auth-and-rbac-system | ✅ DONE | **CRÍTICO**: Usuario recibe "sesión expirada" continuamente, no puede navegar. Backend devuelve 401 en refresh, causando logout infinito. Bloquea toda funcionalidad. |
| 21 | `order-tracking-realtime` | Sistema de tracking en tiempo real para pedidos: Websockets (o polling) que notifiquen cambios de estado (Pendiente → Confirmado → En Preparación → Enviado → Entregado). Dashboard del cliente muestra posición actual. | — | order-fsm-and-trazability, fix-session-loop | 🔜 NEXT (Bloqueante) | Cliente necesita saber dónde está su pedido. Hoy no tiene visibilidad del progreso. Mejora experiencia y reduce llamadas de soporte. |
| 22 | `notification-system` | Sistema de notificaciones: email, push (opcional), in-app cuando estado del pedido cambia, pago confirmado, o evento administrativo. Queue de notificaciones (Redis o Celery). | — | order-fsm-and-trazability, fix-session-loop | Feedback instantáneo al cliente. Pedido cambió de estado → cliente se entero. Fundamental para confianza y engagement. |
