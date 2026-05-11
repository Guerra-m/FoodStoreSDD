# Authorization Guide (RBAC) - FoodStore API

## Overview

The FoodStore API implements **Role-Based Access Control (RBAC)** with JWT tokens. Roles are included as claims in the JWT payload, enabling stateless authorization without database queries per request.

## Roles

The system defines three roles:

| Role | Constant | Description | Permissions |
|------|----------|-------------|-------------|
| **Cliente** | `ROLE_CLIENTE` | Customer (default) | Browse products, place orders |
| **Admin** | `ROLE_ADMIN` | System administrator | Manage system, view statistics, assign roles |
| **Delivery** | `ROLE_DELIVERY` | Delivery personnel | Manage deliveries, view orders |

## Role Assignment

### During Registration

When a user registers via `POST /auth/register`, they are automatically assigned the **Cliente** role:

```json
POST /auth/register
{
  "email": "user@example.com",
  "nombre": "John Doe",
  "password": "SecurePassword123!"
}

// Response (201)
{
  "id": 1,
  "email": "user@example.com",
  "nombre": "John Doe",
  "roles": ["Cliente"],
  "creado_en": "2024-05-10T12:00:00Z"
}
```

### Via Database

Roles can be assigned directly in the database or through admin endpoints (future implementation):

```sql
-- Assign Admin role to user with id=1
INSERT INTO usuarios_roles (usuario_id, role_id)
SELECT 1, id FROM role WHERE nombre = 'Admin';
```

### Via Seed Script

Run the seed script to create roles and default admin user:

```bash
cd backend
python -m scripts.seed

# Output:
# [Seed] Sembrando datos iniciales...
#
# [Roles]:
#   [OK] Rol 'Cliente' creado
#   [OK] Rol 'Admin' creado
#   [OK] Rol 'Delivery' creado
#
# [Admin]:
#   [OK] Usuario Admin creado (email: admin@foodstore.com)
#
# [OK] Seed completado exitosamente.
```

Default admin credentials:
- **Email**: `admin@foodstore.com`
- **Password**: `admin123`

## JWT Token Structure

When a user logs in, the response includes an access token with roles embedded as a claim:

```json
POST /auth/login
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

// Response
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "nombre": "Admin User",
    "roles": ["Admin"],
    "creado_en": "2024-05-10T12:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "opaque_token_string",
  "token_type": "bearer",
  "expires_in": 900
}
```

The JWT payload contains:

```json
{
  "sub": "1",                    // User ID
  "roles": ["Admin"],             // User's roles
  "exp": 1699000000,              // Expiration
  "iat": 1698999100               // Issued at
}
```

**Important**: The "roles" claim includes role names (strings), not IDs. This enables fast, stateless validation on the backend.

### Signature Protection

The JWT is signed with HMAC-SHA256. If a client modifies the "roles" claim, the signature becomes invalid and the token is rejected.

## Role-Based Access Control

### Using `require_roles()` Dependency

Protect endpoints that require specific roles using the `require_roles()` dependency:

```python
from fastapi import APIRouter, Depends
from app.auth.dependencies import require_roles
from app.auth.schemas import UserResponse
from app.auth.roles import ROLE_ADMIN, ROLE_DELIVERY

router = APIRouter()

# Endpoint requiring Admin role
@router.get("/admin/stats")
def get_stats(
    current_user: UserResponse = Depends(require_roles([ROLE_ADMIN]))
):
    """Returns system statistics. Admin only."""
    return {"stats": {...}}

# Endpoint allowing multiple roles
@router.get("/delivery/dashboard")
def delivery_dashboard(
    current_user: UserResponse = Depends(require_roles([ROLE_DELIVERY, ROLE_ADMIN]))
):
    """Delivery dashboard. Delivery or Admin."""
    return {"deliveries": [...]}
```

### How It Works

1. Client sends request with `Authorization: Bearer <access_token>`
2. The `require_roles()` dependency:
   - Extracts and validates the JWT
   - Checks if user's roles match allowed roles
   - Returns **403 Forbidden** if insufficient permissions
   - Returns **UserResponse** with roles if authorized

### Examples

#### ✅ Admin accessing admin endpoint
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/admin/test

# 200 OK
{
  "message": "Acceso Admin concedido a Admin User",
  "user_id": 1,
  "roles": ["Admin"]
}
```

#### ❌ Cliente accessing admin endpoint
```bash
curl -H "Authorization: Bearer $CLIENT_TOKEN" \
  http://localhost:8000/admin/test

# 403 Forbidden
{
  "detail": "Permisos insuficientes. Roles requeridos: Admin"
}
```

#### ✅ Delivery accessing delivery dashboard (multi-role)
```bash
curl -H "Authorization: Bearer $DELIVERY_TOKEN" \
  http://localhost:8000/admin/delivery-dashboard

# 200 OK (Delivery role matches)
```

#### ✅ Admin accessing delivery dashboard (multi-role)
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/admin/delivery-dashboard

# 200 OK (Admin role in required list)
```

## Changing Roles

When a user's roles are updated in the database, the changes are reflected in the next token:

1. User logs in → JWT generated with current roles
2. Admin updates user's roles in database
3. User calls `/auth/refresh` or logs in again
4. New JWT generated with updated roles

Since access tokens expire in 15 minutes, role changes propagate within this window.

## Security Considerations

### ✅ What's Protected

- **JWT Signature**: Tokens are signed with HMAC-SHA256. Modified claims invalidate the signature.
- **Stateless Validation**: Roles are in the token; no database query required per request.
- **Token Expiration**: Access tokens expire in 15 minutes, limiting exposure.
- **Refresh Token Rotation**: Used refresh tokens are revocated.
- **Role Validation**: Server always validates token before trusting claims.

### ⚠️ Best Practices

1. **Refresh tokens**: Store securely (httpOnly cookies preferred, not sessionStorage)
2. **Role changes**: Assign Admin role only to trusted users
3. **Token transport**: Always use HTTPS in production
4. **Endpoint protection**: Apply `require_roles()` to all admin/sensitive endpoints
5. **Audit logging**: Log role changes for compliance

## API Endpoints

### Authentication

| Endpoint | Method | Description | Requires Auth |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Login & get tokens | No |
| `/auth/refresh` | POST | Refresh access token | No |
| `/auth/logout` | POST | Logout (revoke token) | No |
| `/auth/me` | GET | Get current user profile | Yes |

### Admin (Protected)

| Endpoint | Method | Required Role | Description |
|----------|--------|----------------|-------------|
| `/admin/test` | GET | Admin | Test endpoint |
| `/admin/stats` | GET | Admin | System statistics |
| `/admin/delivery-dashboard` | GET | Delivery, Admin | Delivery dashboard |

## Testing RBAC

Run the RBAC test suite:

```bash
cd backend
python -m pytest test_auth_rbac.py -v

# Tests validate:
# - Role assignment during registration
# - Roles included in JWT claims
# - Role-based endpoint access control
# - Multiple roles per user
# - Role changes via token refresh
```

## Seed Script

The seed script creates the role structure idempotently:

```python
# backend/scripts/seed.py

ROLES = [
    {"nombre": "Cliente", "descripcion": "Usuario comprador"},
    {"nombre": "Admin", "descripcion": "Administrador del sistema"},
    {"nombre": "Delivery", "descripcion": "Repartidor de pedidos"},
]
```

Run after database initialization:

```bash
python -m scripts.seed
```

## Troubleshooting

### "Permisos insuficientes" (403)

User doesn't have required role. Check:
1. User's roles in database: `SELECT * FROM usuarios_roles WHERE usuario_id = ?`
2. JWT "roles" claim: Decode token at https://jwt.io
3. Endpoint's `require_roles()` list

### "Token inválido" (401)

Token validation failed. Check:
1. Token is in `Authorization: Bearer <token>` header
2. Token hasn't expired (max 15 minutes)
3. No manual modifications to token

### Roles not updating after database change

Roles update on next token generation (login or refresh). Call `/auth/refresh` to get new token:

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "..."}'
```

---

**Version**: 1.0  
**Last Updated**: 2024-05-10  
**Related**: [JWT Auth Documentation](./JWT.md)
