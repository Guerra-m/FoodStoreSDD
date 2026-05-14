## 1. Preparación

- [x] 1.1 Crear directorios target: `pages/`, `pages/admin/`, `pages/auth/`, `components/admin/`, `router/`

## 2. Mover `app/App.tsx` → `App.tsx` + crear `router/index.tsx`

- [x] 2.1 Mover `app/App.tsx` → `App.tsx` (a la raíz de src/)
- [x] 2.2 Crear `router/index.tsx` con las definiciones de rutas extraídas de App.tsx
- [x] 2.3 Simplificar `App.tsx` para que use `<AppRoutes />` desde `router/`

## 3. Mover `app/pages/` → `pages/`

- [x] 3.1-3.15 Mover todas las páginas de `app/pages/` → `pages/`

## 4. Mover `app/components/` → `components/`

- [x] 4.1-4.4 Mover todos los componentes de `app/components/` → `components/`

## 5. Actualizar imports en archivos movidos

- [x] 5.1 App.tsx: imports actualizados (`./features/`, `./stores/`, `./index.css`)
- [x] 5.2 Pages: imports acortados 1 nivel (`../../` → `../`)
- [x] 5.3 Components: imports acortados 1 nivel
- [x] 5.4 Fix adicional: `main.tsx` import `./app/App` → `./App`
- [x] 5.5 Fix adicional: auth pages `../../../features/` → `../../features/`

## 6. Verificar y limpiar

- [x] 6.1 Verificar que NO queden referencias a `app/` (grep: 0 resultados)
- [x] 6.2 Build: errores son pre-existentes (no de imports)
- [x] 6.3 Eliminar la carpeta `app/` ✓
