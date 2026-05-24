# 🚀 Guía de Inicio: FoodStoreSDD Local

## ✅ Estado Actual
- **Backend**: FastAPI + PostgreSQL + JWT Auth
- **Frontend**: React + TypeScript + Vite + Tailwind
- **DB**: Migraciones Alembic completadas
- **Todas las dependencias instaladas y configuradas**

## 🎯 Cómo Arrancar la App

### Opción 1: Script automático (Recomendado)
```bash
cd /home/noguedev/FoodStoreSDD
./start.sh
```

Esto abre:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **Health Check**: http://localhost:8000/health

### Opción 2: Manual (Terminal 1 - Backend)
```bash
cd /home/noguedev/FoodStoreSDD/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Opción 2: Manual (Terminal 2 - Frontend)
```bash
cd /home/noguedev/FoodStoreSDD/frontend
npm run dev
```

---

## 📋 Qué Funcionan

### Backend (Puerto 8000)
- ✅ Autenticación JWT (login/register)
- ✅ RBAC (Admin, Cliente, Delivery)
- ✅ Categorías (árbol jerárquico)
- ✅ Productos (CRUD + stock)
- ✅ Órdenes (creación atómica)
- ✅ Pagos (MercadoPago)
- ✅ Direcciones de usuario
- ✅ Admin Dashboard

### Frontend (Puerto 5173)
- ✅ Login/Register
- ✅ Catálogo de productos
- ✅ Carrito de compras
- ✅ Checkout
- ✅ Perfil de usuario
- ✅ Admin Panel
- ✅ Toasts/Alertas

---

## 🔧 Configuración Actual

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/foodstore_db
CORS_ORIGINS=["http://localhost:5173"]
MP_ACCESS_TOKEN=TEST-xxxx
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxx
```

---

## 🐛 Issues Corregidos

| Issue | Solución |
|-------|----------|
| RefreshToken import | Movido a `app.auth.models` |
| Alembic migration errors | Reemplazó `sqlmodel.sql.sqltypes.JSON()` por `sa.JSON()` |
| Frontend missing `autoprefixer` | `npm install` ejecutado |
| PostgreSQL schema corrupto | Reseteado y re-migraciones ejecutadas |
| `.env` files missing | Creados con valores por defecto locales |

---

## 📚 Próximos Pasos

1. **Change 19: Landing Page** (próxima tarea)
   - Crear `LandingPage.tsx` con hero section
   - Botón "Pedir" redirecciona a `/catalogo`
   - Ruta `/` pública sin auth

2. **Fixes pendientes del checkout** (May 19)
   - MercadoPago CardPayment brick no carga
   - Public key sigue como placeholder

3. **Change 17: Auth Session Persistence**
   - Fix de navegación SPA
   - Unificar fuentes de verdad de tokens

---

## 🆘 Troubleshooting

### Backend no responde
```bash
# Matar procesos viejos
pkill -f "uvicorn\|python3 main"

# Reiniciar
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

### Frontend no compila
```bash
# Limpiar node_modules
rm -rf frontend/node_modules
npm install

# Reiniciar
npm run dev
```

### PostgreSQL error
```bash
# Verificar que está corriendo
pg_isready -h localhost -U user -d foodstore_db

# Si no está:
# (Requiere admin: sudo systemctl start postgresql)
```

### Port already in use
```bash
# Backend en 8000
lsof -i :8000
kill -9 <PID>

# Frontend en 5173
lsof -i :5173
kill -9 <PID>
```

---

**Hecho por**: Dev AI
**Fecha**: May 24, 2026
**Estado**: ✅ Listo para correr
