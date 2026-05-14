## Context

La capa 1 movió `shared/` a la raíz de `src/`. Ahora `app/` queda como la única carpeta anidada innecesariamente. Contiene `App.tsx`, páginas y componentes que deben estar en la raíz de `src/` según la arquitectura target. Además, `App.tsx` mezcla definición de rutas con layout general — hay que extraer el router.

## Goals / Non-Goals

**Goals:**
- Mover `app/App.tsx` → `App.tsx` (raíz de `src/`)
- Mover `app/pages/` → `pages/` (incluyendo subcarpetas admin/, auth/)
- Mover `app/components/` → `components/` (incluyendo subcarpeta admin/)
- Extraer rutas de `App.tsx` → `router/index.tsx`
- Actualizar todos los imports afectados
- Eliminar `app/` al finalizar

**Non-Goals:**
- NO cambiar lógica de navegación o layout
- NO tocar `features/` (layer 3)
- NO modificar el Navbar ni componentes de layout

## Decisions

| Decisión | Opción | Razón |
|----------|--------|-------|
| Router extraído | `router/index.tsx` exporta un componente `<AppRoutes />` | Separación clara: rutas en router/, layout en App.tsx |
| App simplificada | App.tsx solo monta QueryClientProvider, BrowserRouter, AuthProvider, Navbar, CartDrawer, ToastContainer y `<AppRoutes />` | Responsabilidad única |
| Prefijo de imports | `./pages/` se mantiene igual porque App.tsx sube a raíz de src/ | La ruta relativa `./pages/` desde `src/` apunta a `pages/` ✓ |
| Navbar se queda en App.tsx | No se mueve a componentes/ | Está fuertemente acoplado al estado global (auth, carrito, UI). Se refactorizará en otra ocasión si hace falta. |

## Mapping de archivos

```
app/App.tsx                    →  App.tsx          (raíz de src/)
                                →  router/index.tsx (rutas extraídas)

app/pages/                     →  pages/
├── Catalogo.tsx               →  pages/Catalogo.tsx
├── Categorias.tsx             →  pages/Categorias.tsx
├── MiPerfil.tsx               →  pages/MiPerfil.tsx
├── MisPedidos.tsx             →  pages/MisPedidos.tsx
├── OrderConfirmationPage.tsx  →  pages/OrderConfirmationPage.tsx
├── PaymentResultPage.tsx      →  pages/PaymentResultPage.tsx
├── ProductoDetalle.tsx        →  pages/ProductoDetalle.tsx
├── Productos.tsx              →  pages/Productos.tsx
├── admin/                     →  pages/admin/
│   ├── DashboardPage.tsx      →  pages/admin/DashboardPage.tsx
│   ├── OrderDetailPage.tsx    →  pages/admin/OrderDetailPage.tsx
│   ├── OrdersPage.tsx         →  pages/admin/OrdersPage.tsx
│   └── UsersPage.tsx          →  pages/admin/UsersPage.tsx
└── auth/                      →  pages/auth/
    ├── LoginPage.tsx          →  pages/auth/LoginPage.tsx
    ├── RegisterPage.tsx       →  pages/auth/RegisterPage.tsx
    └── UnauthorizedPage.tsx   →  pages/auth/UnauthorizedPage.tsx

app/components/                →  components/
├── AddressCard.tsx            →  components/AddressCard.tsx
├── AddressFormModal.tsx       →  components/AddressFormModal.tsx
└── admin/                     →  components/admin/
    ├── AdminLayout.tsx         →  components/admin/AdminLayout.tsx
    └── Sidebar.tsx             →  components/admin/Sidebar.tsx
```

## Cambios de imports clave

### App.tsx (al moverse de app/ a src/)
| Import actual | Nuevo import |
|-------------|-------------|
| `'./pages/...'` | se mantiene igual |
| `'./components/...'` | se mantiene igual |
| `'../features/...'` | `'./features/...'` |
| `'../stores/...'` | `'./stores/...'` |
| `'../index.css'` | `'./index.css'` |

### Pages (al moverse de app/pages/ a pages/)
Los imports relativos se acortan en 1 nivel:
- `'../../shared/...'` → ya se actualizó en layer 1
- `'../../hooks/...'` → `'../hooks/...'`
- `'../../stores/...'` → `'../stores/...'`
- `'../../api/...'` → `'../api/...'`
- `'../../components/...'` → `'../components/...'`
- `'../../../shared/...'` → ya se actualizó en layer 1
- `'../../../api/...'` → `'../../api/...'` (admin pages)
- `'../../../components/...'` → `'../../components/...'` (admin pages)
- `'../../../features/...'` → `'../../features/...'` (admin pages)

### Components (al moverse de app/components/ a components/)
- `'../../shared/...'` → ya se actualizó en layer 1
- `'../../api/...'` → `'../api/...'`
- `'../../../api/...'` (admin) → `'../../api/...'`
- `'../../../features/...'` (admin) → `'../../features/...'`

## Riesgos / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| **Import olvidado**: archivo sigue importando desde `app/` | Hacer grep al final |
| **Router mal extraído**: rutas no funcionan igual | Comparar el router extraído con el original línea por línea |
| **Navbar pierde contexto**: los hooks de stores y auth deben mantenerse | Navbar se queda en App.tsx, no se mueve |
