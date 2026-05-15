# Sistema de Autenticación - Food Store API

## 📖 Descripción

Sistema completo de autenticación basado en JWT con refresh token rotation, implementado en FastAPI (backend) y React (frontend). Incluye registro de usuarios, login seguro, renovación automática de tokens, detección de robo y logout.

---

## 🏗️ Estructura de Carpetas

### Backend

```
backend/
├── app/
│   ├── auth/                          # Módulo de autenticación
│   │   ├── __init__.py
│   │   ├── models.py                  # Modelos SQLAlchemy (User, RefreshToken)
│   │   ├── schemas.py                 # Schemas Pydantic (requests/responses)
│   │   ├── services.py                # AuthService (lógica de negocio)
│   │   ├── routes.py                  # Endpoints FastAPI
│   │   ├── security.py                # Funciones criptográficas
│   │   └── dependencies.py            # Inyección de dependencias
│   ├── core/
│   │   ├── config.py                  # Configuración global (incluye JWT)
│   │   ├── database.py                # Conexión a BD
│   │   └── exceptions.py
│   ├── modules/                       # Otros módulos (categorías, productos, etc.)
│   └── main.py                        # FastAPI app principal
├── .env                               # Variables de entorno (gitignored)
├── .env.example                       # Ejemplo de .env
├── requirements.txt                   # Dependencias Python
├── test_auth_security.py              # Tests de seguridad
└── test_auth_e2e.py                   # Tests end-to-end
```

### Frontend

```
frontend/
├── src/
│   ├── features/
│   │   └── auth/                      # Módulo de autenticación
│   │       ├── types.ts               # Interfaces TypeScript
│   │       ├── utils.ts               # Funciones utilitarias
│   │       ├── hooks/
│   │       │   └── useAuth.ts         # Hook de autenticación
│   │       ├── services/
│   │       │   └── authApi.ts         # Llamadas a API
│   │       ├── context/
│   │       │   └── AuthContext.tsx    # Contexto global
│   │       ├── components/
│   │       │   ├── LoginForm.tsx      # Formulario de login
│   │       │   ├── LoginForm.module.css
│   │       │   ├── RegisterForm.tsx   # Formulario de registro
│   │       │   ├── RegisterForm.module.css
│   │       │   ├── ProtectedRoute.tsx # Ruta protegida
│   │       │   ├── LogoutButton.tsx   # Botón de logout
│   │       │   ├── LogoutButton.module.css
│   │       │   └── tests/
│   │       │       └── auth.test.ts   # Tests del frontend
│   ├── app/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   └── ...
│   │   └── App.tsx                    # App con AuthProvider
│   └── main.tsx
└── package.json
```

---

## 🚀 Instalación

### Backend

```bash
cd backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar .env
cp .env.example .env
# Editar .env con tus valores
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

---

## 🔧 Configuración

### Variables de Entorno (Backend)

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore_db

# Autenticación
JWT_SECRET_KEY=tu-clave-secreta-muy-segura-min-32-caracteres
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173

# Otros
SECRET_KEY=otra-clave-secreta
MERCADOPAGO_ACCESS_TOKEN=tu-token-mercadopago
```

**⚠️ Importante:**
- `JWT_SECRET_KEY` debe ser mínimo 32 caracteres
- Nunca commitear `.env` con secretos reales
- En producción, usar secrets manager (AWS Secrets, HashiCorp Vault, etc.)

### Variables de Entorno (Frontend)

En `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

---

## 💾 Base de Datos

El sistema usa las siguientes tablas (creadas automáticamente por Alembic):

### Tabla `usuario`
```sql
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    nombre VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    telefono VARCHAR,
    creado_en TIMESTAMP,
    actualizado_en TIMESTAMP,
    eliminado_en TIMESTAMP
);
```

### Tabla `refresh_token`
```sql
CREATE TABLE refresh_token (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revocado_en TIMESTAMP,
    creado_en TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);
```

---

## 📡 API Endpoints

### POST `/auth/register`
Registra un nuevo usuario.

**Request:**
```json
{
    "email": "usuario@example.com",
    "nombre": "Juan García",
    "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan García",
    "rol": "Cliente",
    "creado_en": "2024-05-10T12:00:00"
}
```

**Errores:**
- `400`: Email inválido, contraseña débil
- `409`: Email ya registrado
- `422`: Validación fallida

---

### POST `/auth/login`
Autentica un usuario.

**Request:**
```json
{
    "email": "usuario@example.com",
    "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
    "user": {
        "id": 1,
        "email": "usuario@example.com",
        "nombre": "Juan García",
        "rol": "Cliente",
        "creado_en": "2024-05-10T12:00:00"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "kv3X5pZ9jQ7mN4wLaB6cD8eF2uH1rT5s",
    "token_type": "bearer",
    "expires_in": 900
}
```

**Errores:**
- `401`: Credenciales inválidas (respuesta genérica)

---

### POST `/auth/refresh`
Renueva el access token usando un refresh token.

**Request:**
```json
{
    "refresh_token": "kv3X5pZ9jQ7mN4wLaB6cD8eF2uH1rT5s"
}
```

**Response (200):**
```json
{
    "user": {...},
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "nueva_token_rotado",
    "token_type": "bearer",
    "expires_in": 900
}
```

**Errores:**
- `401`: Token inválido, revocado o expirado (posible robo detectado)

---

### POST `/auth/logout`
Cierra sesión revocando el refresh token.

**Request:**
```json
{
    "refresh_token": "kv3X5pZ9jQ7mN4wLaB6cD8eF2uH1rT5s"
}
```

**Response (200):**
```json
{
    "message": "Logout exitoso"
}
```

---

### GET `/auth/me`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan García",
    "rol": "Cliente",
    "creado_en": "2024-05-10T12:00:00"
}
```

**Errores:**
- `401`: Token inválido, ausente o expirado

---

## 🎯 Uso en Frontend

### 1. Envolver la App con AuthProvider

En `App.tsx`:
```tsx
import { AuthProvider } from './features/auth/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Resto de la app */}
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 2. Usar el Hook useAuth

```tsx
import { useAuth } from '@/features/auth/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();

  if (isLoading) return <p>Cargando...</p>;

  if (!isAuthenticated) {
    return <p>No estás autenticado</p>;
  }

  return (
    <div>
      <p>Bienvenido, {user?.nombre}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Proteger Rutas

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 4. Formularios de Autenticación

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

function LoginPage() {
  return <LoginForm onSuccess={() => navigate('/')} />;
}
```

---

## 🔐 Seguridad

### Contraseñas
- ✅ Hasheadas con bcrypt
- ✅ Validación de mínimo 8 caracteres en cliente y servidor
- ✅ Nunca se loguean o retornan en respuestas

### Tokens
- ✅ Access token (JWT): 15 minutos de duración
- ✅ Refresh token (opaco): 7 días de duración
- ✅ Almacenados en `sessionStorage` (cliente)
- ✅ Rotación automática al renovar
- ✅ Detección de robo: si token revocado se reutiliza, se revocan TODOS

### Email
- ✅ Validación de formato
- ✅ Unicidad enforcement (BD + app)

### Errores
- ✅ Respuestas genéricas en login (no revelan si email existe)
- ✅ Timing attacks mitigados (bcrypt tarda igual)

### CORS
- ✅ Origen específico (no `*`)
- ✅ Credenciales permitidas

---

## 🧪 Testing

Ver `TESTING_GUIDE.md` para:
- Cómo ejecutar tests
- Casos de prueba manuales
- Validaciones de seguridad

Ejecución rápida:
```bash
# Backend
python backend/test_auth_security.py
python backend/test_auth_e2e.py

# Frontend (en navegador)
Abre consola (F12) y ejecuta código de auth.test.ts
```

---

## 📚 Documentación Adicional

- **SECURITY_VALIDATION.md** - Validaciones de seguridad completadas
- **TESTING_GUIDE.md** - Guía de testing detallada
- **SECURITY.md** - Recomendaciones de seguridad para desarrolladores

---

## 🔄 Flujo de Autenticación

```
REGISTRO
─────────
1. Usuario completa formulario
2. Frontend valida email/password
3. POST /auth/register con credenciales
4. Backend:
   - Valida email/password
   - Verifica email único
   - Hashea password con bcrypt
   - Crea usuario en BD
5. Retorna UserResponse (sin password)
6. Auto-login

LOGIN
─────
1. Usuario completa formulario
2. Frontend valida email/password
3. POST /auth/login con credenciales
4. Backend:
   - Busca usuario por email
   - Verifica password con bcrypt
   - Genera JWT (access token)
   - Genera token opaco (refresh token)
   - Almacena hash de refresh token en BD
5. Retorna access_token + refresh_token
6. Frontend guarda tokens en sessionStorage

ACCESO A ENDPOINTS PROTEGIDOS
──────────────────────────────
1. Cliente agrega header: Authorization: Bearer <access_token>
2. Backend valida JWT:
   - Verifica firma
   - Verifica expiración
   - Extrae user_id
3. Continúa request o rechaza con 401

REFRESH AUTOMÁTICO
───────────────────
1. Frontend detecta que token expira en 1 minuto
2. POST /auth/refresh con refresh_token
3. Backend:
   - Verifica refresh token
   - Revoca token antiguo
   - Genera nuevo acceso + refresh token
4. Frontend actualiza tokens
5. Solicitud original se reintenta

DETECCIÓN DE ROBO
──────────────────
1. Atacante intenta reutilizar refresh token revocado
2. POST /auth/refresh con token revocado
3. Backend:
   - Detecta que token fue revocado
   - REVOCA TODOS los tokens del usuario
   - Retorna 401
4. Usuario debe re-autenticarse (login nuevamente)

LOGOUT
──────
1. Usuario hace clic en botón logout
2. POST /auth/logout con refresh_token
3. Backend marca token como revocado en BD
4. Frontend limpia tokens de sessionStorage
5. Usuario redirigido a login
```

---

## 🐛 Troubleshooting

### "Token expirado" constantemente
- Aumenta `ACCESS_TOKEN_EXPIRE_MINUTES` en `.env`
- Verifica que la hora del servidor está correcta

### "Email ya registrado" pero es nuevo
- Verifica que no hay datos previos en BD
- Ejecuta: `python setup_db.py` para resetear

### CORS errors en el navegador
- Verifica `CORS_ORIGINS` en `.env`
- Debe incluir el origin del frontend: `http://localhost:5173`

### Frontend no ve cambios
- Limpia caché: `npm run build && npm run dev`
- Reinicia el servidor

---

## 📊 Estado de Implementación

| Componente | Estado | Detalles |
|---|---|---|
| Backend endpoints | ✅ | 5 endpoints implementados |
| Modelos BD | ✅ | User + RefreshToken |
| Seguridad | ✅ | Bcrypt, JWT, token rotation |
| Frontend UI | ✅ | Login/Register forms |
| Context/State | ✅ | AuthContext + useAuth hook |
| Testing | ✅ | 38+ tests |
| Documentación | ✅ | README + SECURITY + TESTING |

---

## 🎓 Próximos Pasos (Recomendados)

1. **Rate Limiting** - Proteger contra fuerza bruta
2. **Email Verification** - Confirmar email al registrar
3. **Password Reset** - Recuperación de contraseña
4. **2FA/MFA** - Autenticación de múltiples factores
5. **Audit Logging** - Registrar intentos de auth
6. **Session Management** - Revocar sesiones antiguas
7. **Biometric Auth** - Autenticación por huella dactilar (mobile)

---

## 📝 Licencia

Este proyecto es parte de Food Store SDD. Ver LICENSE.md para detalles.

---

## ❓ Preguntas?

Ver documentación en:
- `SECURITY_VALIDATION.md` - Validaciones implementadas
- `TESTING_GUIDE.md` - Cómo testear el sistema
- Código comentado en cada módulo
