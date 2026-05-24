# 🔐 Test Credentials — FoodStoreSDD

Credenciales para testing en local. Los usuarios ya están creados en PostgreSQL.

## 👨‍💼 Admin User

```
Email:    admin@foodstore.com
Password: admin123
Role:     Admin
```

**Permisos**:
- ✅ Ver Dashboard Admin
- ✅ Gestionar usuarios
- ✅ Gestionar categorías/productos
- ✅ Ver órdenes de todos los clientes
- ✅ Ver pagos

**Login endpoint**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@foodstore.com",
    "password": "admin123"
  }'
```

---

## 👤 Cliente User (Test)

```
Email:    cliente@foodstore.com
Password: cliente123
Role:     Cliente
Name:     Juan Pérez
```

**Permisos**:
- ✅ Ver catálogo de productos
- ✅ Crear carrito
- ✅ Crear órdenes
- ✅ Ver mis órdenes
- ✅ Gestionar mis direcciones
- ✅ Ver mi perfil

**Login endpoint**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@foodstore.com",
    "password": "cliente123"
  }'
```

---

## 🚀 Testing Frontend

### Con Admin
1. Abre http://localhost:5173
2. Login con `admin@foodstore.com` / `admin123`
3. Accede a `/admin` para ver Dashboard

### Con Cliente
1. Abre http://localhost:5173
2. Login con `cliente@foodstore.com` / `cliente123`
3. Accede a `/catalogo` para ver productos
4. Añade al carrito y crea una orden

---

## 📝 Notas

- Los usuarios están hasheados con **bcrypt** en la DB
- JWT tokens expiran en **15 minutos** (ACCESS_TOKEN_EXPIRE_MINUTES=15)
- Refresh tokens duran **7 días** (REFRESH_TOKEN_EXPIRE_DAYS=7)
- Tokens se guardan en `localStorage` del navegador
- CORS configurado para `http://localhost:5173`

---

## 🔄 Crear Nuevos Usuarios (Python)

```python
from sqlmodel import Session
from app.core.database import engine
from app.modules.usuarios.model import Usuario, Role, UsuarioRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

with Session(engine) as session:
    # Create role if needed
    role = session.query(Role).filter(Role.nombre == "Cliente").first()
    
    # Create user
    user = Usuario(
        nombre="Test User",
        email="test@foodstore.com",
        password_hash=pwd_context.hash("test123"),
        telefono="555-1234"
    )
    session.add(user)
    session.commit()
    
    # Assign role
    session.add(UsuarioRole(usuario_id=user.id, role_id=role.id))
    session.commit()
```

---

**Created**: May 24, 2026  
**Status**: ✅ Ready for testing
