"""
Tests for password change endpoint (US-063).
Cubre tasks 3.1 y 3.2 del change auth-security-enhancements.

Verifica:
  - Cambio de contraseña exitoso (3.1)
  - Contraseña actual incorrecta devuelve 400 (3.2)

Ejecución: python -m pytest backend/test_password_change.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from main import app
from app.core.security import hash_password, create_access_token, verify_password
from app.modules.usuarios.model import Role
from app.auth.models import User, RefreshToken
from app.auth.roles import ROLE_CLIENTE


# === HELPERS ===

def _dedup_indexes():
    """SQLModel tiene dos modelos (Usuario y User) apuntando a la misma
    tabla 'usuario', lo que duplica el índice ix_usuario_email.
    Esta función elimina los duplicados antes de create_all."""
    for table in SQLModel.metadata.tables.values():
        seen = {}
        for idx in list(table.indexes):
            key = (idx.name, tuple(c.name for c in idx.columns))
            if key in seen:
                table.indexes.discard(idx)
            else:
                seen[key] = idx


# === DATABASE SETUP ===

@pytest.fixture(name="session")
def session_fixture(monkeypatch):
    """Crea BD en memoria y parchea el engine global para UnitOfWork."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Monkeypatch: los servicios usan UnitOfWork() que importa engine globalmente
    import app.core.database as db_module
    import app.core.unit_of_work as uow_module
    monkeypatch.setattr(db_module, "engine", engine)
    monkeypatch.setattr(uow_module, "engine", engine)

    # Deduplicar índices antes de crear las tablas
    _dedup_indexes()
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Seed: crear rol Cliente (necesario para create_access_token, etc.)
        cliente_role = Role(nombre=ROLE_CLIENTE, descripcion="Usuario comprador")
        session.add(cliente_role)
        session.commit()
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Cliente TestClient. No hace falta override de get_session porque
    el endpoint usa UnitOfWork directamente."""
    client = TestClient(app)
    yield client


# === TESTS ===

class TestPasswordChangeSuccessful:
    """3.1 — Test successful password change."""

    @pytest.fixture(autouse=True)
    def _setup(self, session: Session):
        """Crea un usuario de prueba con contraseña conocida."""
        self.original_password = "ViejaPass123!"
        self.new_password = "NuevaPass456!"
        self.user = User(
            nombre="Password Tester",
            email="password-test@example.com",
            password_hash=hash_password(self.original_password),
        )
        session.add(self.user)
        session.commit()
        session.refresh(self.user)

        # Generar JWT para este usuario
        self.access_token = create_access_token(
            sub=str(self.user.id),
            roles=[ROLE_CLIENTE],
        )

    def test_change_password_returns_200(self, client: TestClient):
        """El endpoint responde 200 con mensaje de éxito."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": self.original_password,
                "new_password": self.new_password,
            },
            headers={"Authorization": f"Bearer {self.access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Contraseña actualizada exitosamente"

    def test_password_hash_is_updated_in_db(self, client: TestClient, session: Session):
        """El hash almacenado en BD cambia después del cambio exitoso."""
        old_hash = self.user.password_hash

        client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": self.original_password,
                "new_password": self.new_password,
            },
            headers={"Authorization": f"Bearer {self.access_token}"},
        )

        session.refresh(self.user)
        new_hash = self.user.password_hash

        assert new_hash != old_hash, "El hash debería haber cambiado"
        assert verify_password(self.new_password, new_hash), "La nueva contraseña debería verificar contra el nuevo hash"
        assert not verify_password(self.original_password, new_hash), "La contraseña vieja NO debería verificar contra el nuevo hash"


class TestPasswordChangeFailure:
    """3.2 — Test failed password change (incorrect password)."""

    @pytest.fixture(autouse=True)
    def _setup(self, session: Session):
        self.original_password = "RealPass123!"
        self.wrong_password = "WrongPass456!"
        self.new_password = "NuevaPass789!"
        self.user = User(
            nombre="Fail Tester",
            email="fail-test@example.com",
            password_hash=hash_password(self.original_password),
        )
        session.add(self.user)
        session.commit()
        session.refresh(self.user)

        self.access_token = create_access_token(
            sub=str(self.user.id),
            roles=[ROLE_CLIENTE],
        )

    def test_incorrect_current_password_returns_400(self, client: TestClient):
        """Enviar current_password incorrecta devuelve 400 Bad Request."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": self.wrong_password,
                "new_password": self.new_password,
            },
            headers={"Authorization": f"Bearer {self.access_token}"},
        )

        assert response.status_code == 400
        data = response.json()
        assert "incorrecta" in data["detail"].lower()

    def test_password_not_changed_on_failure(self, client: TestClient, session: Session):
        """Si falla el cambio, la contraseña original sigue siendo válida."""
        old_hash = self.user.password_hash

        client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": self.wrong_password,
                "new_password": self.new_password,
            },
            headers={"Authorization": f"Bearer {self.access_token}"},
        )

        session.refresh(self.user)
        assert self.user.password_hash == old_hash, "El hash NO debería haber cambiado"
        assert verify_password(self.original_password, self.user.password_hash)

    def test_unauthenticated_request_returns_401(self, client: TestClient):
        """Llamar sin token de acceso devuelve 401."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": "anything",
                "new_password": "anything",
            },
        )

        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
