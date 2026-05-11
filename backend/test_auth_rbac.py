"""
Tests de RBAC (Role-Based Access Control) para el sistema de autenticación.
Valida que los roles se asignan correctamente, se incluyen en JWT, y se validan en endpoints.

Ejecución: python -m pytest backend/test_auth_rbac.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select, create_engine
from sqlmodel.pool import StaticPool
import json
from datetime import datetime

from main import app
from app.core.database import get_session
from app.auth.models import User
from app.modules.usuarios.model import Role, UsuarioRole
from app.auth.security import hash_password, verify_jwt_token, extract_roles_from_token
from app.core.config import settings
from app.auth.roles import ROLE_CLIENTE, ROLE_ADMIN, ROLE_DELIVERY


# === DATABASE SETUP ===

@pytest.fixture(name="session")
def session_fixture():
    """Crea una base de datos en memoria para tests."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Crear todas las tablas
    from app.auth.models import RefreshToken
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Crear roles base
        roles_data = [
            {"nombre": ROLE_CLIENTE, "descripcion": "Usuario comprador"},
            {"nombre": ROLE_ADMIN, "descripcion": "Administrador del sistema"},
            {"nombre": ROLE_DELIVERY, "descripcion": "Repartidor de pedidos"},
        ]
        for role_data in roles_data:
            role = Role(**role_data)
            session.add(role)
        session.commit()
        
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Crea un cliente test con sesión customizada."""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# === TESTS ===

class TestRBACRegistration:
    """Tests de asignación de roles durante registro."""
    
    def test_register_assigns_cliente_role(self, client: TestClient, session: Session):
        """Verifica que el registro asigna automáticamente rol Cliente."""
        response = client.post(
            "/auth/register",
            json={
                "email": "cliente@example.com",
                "nombre": "Cliente Test",
                "password": "SecurePassword123!"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "cliente@example.com"
        assert data["nombre"] == "Cliente Test"
        assert ROLE_CLIENTE in data["roles"]
        
        # Verificar en BD
        user = session.exec(
            select(User).where(User.email == "cliente@example.com")
        ).first()
        assert user is not None
        
        user_roles = session.exec(
            select(Role).join(UsuarioRole).where(UsuarioRole.usuario_id == user.id)
        ).all()
        assert len(user_roles) == 1
        assert user_roles[0].nombre == ROLE_CLIENTE
    
    def test_register_response_includes_roles(self, client: TestClient):
        """Verifica que la respuesta de registro incluye campo 'roles'."""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "nombre": "Test User",
                "password": "SecurePassword123!"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "roles" in data
        assert isinstance(data["roles"], list)


class TestJWTRoleClaims:
    """Tests de inclusión de roles en JWT."""
    
    def test_login_jwt_includes_roles_claim(self, client: TestClient, session: Session):
        """Verifica que el JWT incluye claim 'roles' en el payload."""
        # Crear usuario
        user = User(
            email="admin_test@example.com",
            nombre="Admin Test",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        # Asignar rol Admin
        admin_role = session.exec(select(Role).where(Role.nombre == ROLE_ADMIN)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=admin_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "admin_test@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        access_token = data["access_token"]
        
        # Decodificar JWT y verificar claim
        payload = verify_jwt_token(access_token, settings.JWT_SECRET_KEY)
        assert "roles" in payload
        assert isinstance(payload["roles"], list)
        assert ROLE_ADMIN in payload["roles"]
    
    def test_refresh_token_updates_roles(self, client: TestClient, session: Session):
        """Verifica que refresh obtiene roles actuales de BD."""
        # Crear usuario con rol Cliente
        user = User(
            email="refresh_test@example.com",
            nombre="Refresh Test",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        cliente_role = session.exec(select(Role).where(Role.nombre == ROLE_CLIENTE)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=cliente_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "refresh_test@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        data = response.json()
        refresh_token = data["refresh_token"]
        old_access_token = data["access_token"]
        
        # Verificar JWT inicial
        payload1 = verify_jwt_token(old_access_token, settings.JWT_SECRET_KEY)
        assert payload1["roles"] == [ROLE_CLIENTE]
        
        # Agregar rol Admin a usuario
        admin_role = session.exec(select(Role).where(Role.nombre == ROLE_ADMIN)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=admin_role.id))
        session.commit()
        
        # Refresh token
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        new_access_token = data["access_token"]
        
        # Verificar que nuevo JWT refleja cambios
        payload2 = verify_jwt_token(new_access_token, settings.JWT_SECRET_KEY)
        assert set(payload2["roles"]) == {ROLE_CLIENTE, ROLE_ADMIN}


class TestRoleBasedEndpointAccess:
    """Tests de control de acceso basado en roles."""
    
    def test_admin_endpoint_allows_admin_role(self, client: TestClient, session: Session):
        """Verifica que endpoint Admin acepta usuarios con rol Admin."""
        # Crear admin
        user = User(
            email="admin@example.com",
            nombre="Admin User",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        admin_role = session.exec(select(Role).where(Role.nombre == ROLE_ADMIN)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=admin_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "admin@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        access_token = response.json()["access_token"]
        
        # Acceder a endpoint Admin
        response = client.get(
            "/admin/test",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Admin" in data["message"]
    
    def test_admin_endpoint_denies_cliente_role(self, client: TestClient, session: Session):
        """Verifica que endpoint Admin rechaza usuarios sin rol Admin (403)."""
        # Crear cliente
        user = User(
            email="cliente@example.com",
            nombre="Cliente User",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        cliente_role = session.exec(select(Role).where(Role.nombre == ROLE_CLIENTE)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=cliente_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "cliente@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        access_token = response.json()["access_token"]
        
        # Intentar acceder a endpoint Admin
        response = client.get(
            "/admin/test",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 403
        assert "Permisos insuficientes" in response.json()["detail"]
    
    def test_delivery_endpoint_allows_multiple_roles(self, client: TestClient, session: Session):
        """Verifica que endpoint que acepta múltiples roles funciona correctamente."""
        # Crear delivery
        user = User(
            email="delivery@example.com",
            nombre="Delivery User",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        delivery_role = session.exec(select(Role).where(Role.nombre == ROLE_DELIVERY)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=delivery_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "delivery@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        access_token = response.json()["access_token"]
        
        # Acceder a endpoint que acepta Delivery y Admin
        response = client.get(
            "/admin/delivery-dashboard",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
    
    def test_endpoint_requires_auth(self, client: TestClient):
        """Verifica que endpoint requiere autenticación (401 sin token)."""
        response = client.get("/admin/test")
        
        assert response.status_code == 401


class TestMultipleRoles:
    """Tests de usuarios con múltiples roles."""
    
    def test_user_with_multiple_roles(self, client: TestClient, session: Session):
        """Verifica que un usuario puede tener múltiples roles."""
        # Crear usuario
        user = User(
            email="multi@example.com",
            nombre="Multi Role User",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        # Asignar múltiples roles
        admin_role = session.exec(select(Role).where(Role.nombre == ROLE_ADMIN)).first()
        delivery_role = session.exec(select(Role).where(Role.nombre == ROLE_DELIVERY)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=admin_role.id))
        session.add(UsuarioRole(usuario_id=user.id, role_id=delivery_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "multi@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        data = response.json()
        assert len(data["user"]["roles"]) == 2
        assert ROLE_ADMIN in data["user"]["roles"]
        assert ROLE_DELIVERY in data["user"]["roles"]


class TestGetCurrentUser:
    """Tests de endpoint GET /auth/me con roles."""
    
    def test_get_me_includes_roles(self, client: TestClient, session: Session):
        """Verifica que GET /auth/me incluye roles del usuario."""
        # Crear usuario
        user = User(
            email="getme@example.com",
            nombre="Get Me Test",
            password_hash=hash_password("SecurePassword123!")
        )
        session.add(user)
        session.flush()
        
        admin_role = session.exec(select(Role).where(Role.nombre == ROLE_ADMIN)).first()
        session.add(UsuarioRole(usuario_id=user.id, role_id=admin_role.id))
        session.commit()
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "getme@example.com",
                "password": "SecurePassword123!"
            }
        )
        
        access_token = response.json()["access_token"]
        
        # GET /auth/me
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        assert ROLE_ADMIN in data["roles"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
