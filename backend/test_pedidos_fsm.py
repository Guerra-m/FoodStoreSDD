"""
Tests de integración para el FSM de pedidos (order-fsm-and-trazability).

Valida:
- Transiciones válidas e inválidas
- Autorización por rol (cliente vs admin)
- Restauración de stock al cancelar
- Audit trail (historial)
- Flujo completo: crear → pagar → preparar → enviar → entregar

Ejecución: python -m pytest backend/test_pedidos_fsm.py -v
Requiere: pytest, httpx
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select, create_engine
from sqlmodel.pool import StaticPool
from datetime import datetime

from main import app
from app.core.database import get_session
from app.auth.models import User
from app.modules.usuarios.model import Role, UsuarioRole
from app.modules.pedidos.model import Pedido, PedidoItem, PedidoHistorial, EstadoPedido
from app.modules.productos.model import Producto
from app.auth.security import hash_password


# === DATABASE SETUP ===

@pytest.fixture(name="session")
def session_fixture():
    """Crea una base de datos en memoria para tests."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Crear roles base
        roles_data = [
            {"nombre": "Cliente", "descripcion": "Usuario comprador"},
            {"nombre": "Admin", "descripcion": "Administrador del sistema"},
        ]
        for role_data in roles_data:
            role = Role(**role_data)
            session.add(role)
        session.commit()
        yield session


# === FIXTURES ===

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Crea un TestClient con la DB en memoria."""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="session_with_admin")
def session_with_admin_fixture(session: Session):
    """Agrega un usuario admin a la sesión."""
    user = User(
        nombre="Admin Test",
        email="admin@test.com",
        password_hash=hash_password("password123"),
    )
    session.add(user)
    session.flush()

    role = session.exec(select(Role).where(Role.nombre == "Admin")).first()
    session.add(UsuarioRole(usuario_id=user.id, role_id=role.id))
    session.commit()

    return {"id": user.id, "email": "admin@test.com", "password": "password123"}


@pytest.fixture(name="session_with_cliente")
def session_with_cliente_fixture(session: Session):
    """Agrega un usuario cliente a la sesión."""
    user = User(
        nombre="Cliente Test",
        email="cliente@test.com",
        password_hash=hash_password("password123"),
    )
    session.add(user)
    session.flush()

    role = session.exec(select(Role).where(Role.nombre == "Cliente")).first()
    session.add(UsuarioRole(usuario_id=user.id, role_id=role.id))
    session.commit()

    return {"id": user.id, "email": "cliente@test.com", "password": "password123"}


@pytest.fixture(name="auth_admin")
def auth_admin_fixture(client: TestClient, session_with_admin: dict):
    """Headers de autenticación para admin."""
    r = client.post("/api/v1/auth/login", json={
        "email": session_with_admin["email"],
        "password": session_with_admin["password"],
    })
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="auth_cliente")
def auth_cliente_fixture(client: TestClient, session_with_cliente: dict):
    """Headers de autenticación para cliente."""
    r = client.post("/api/v1/auth/login", json={
        "email": session_with_cliente["email"],
        "password": session_with_cliente["password"],
    })
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="pedido_en_pendiente")
def pedido_en_pendiente_fixture(session: Session, session_with_cliente: dict):
    """Crea un pedido en estado pendiente con producto y stock."""
    # Crear producto con stock
    prod = Producto(
        nombre="Producto Test FSM",
        descripcion="Para tests de FSM",
        price_in_cents=1000,
        stock=10,
        is_active=True,
    )
    session.add(prod)
    session.flush()

    # Crear pedido pendiente
    pedido = Pedido(
        cliente_id=session_with_cliente["id"],
        direccion_id=0,  # Dummy, no se valida en transiciones
        direccion_snapshot={"calle": "Test"},
        total=2000,
        estado=EstadoPedido.PENDIENTE.value,
    )
    session.add(pedido)
    session.flush()

    # Crear item
    item = PedidoItem(
        pedido_id=pedido.id,
        producto_id=prod.id,
        producto_snapshot={"nombre": prod.nombre, "price_in_cents": prod.price_in_cents},
        cantidad=2,
        precio_unitario=prod.price_in_cents,
        ingredientes_excluidos=[],
    )
    session.add(item)

    # Crear historial inicial
    historial = PedidoHistorial(
        pedido_id=pedido.id,
        estado=EstadoPedido.PENDIENTE.value,
        timestamp=datetime.utcnow(),
        usuario_id=None,
        descripcion="Pedido creado",
    )
    session.add(historial)
    session.commit()

    return {"pedido_id": pedido.id, "producto_id": prod.id, "stock_inicial": 10}


# === TESTS ===

class TestPedidosFSM:
    """Suite de tests para el FSM de pedidos."""

    def test_1_flujo_completo_admin(self, client, auth_admin, pedido_en_pendiente):
        """Flujo completo: pagar → preparar → enviar → entregar."""
        pid = pedido_en_pendiente["pedido_id"]
        transiciones = [
            ("pagar", "pagado", "Pago confirmado"),
            ("preparar", "preparando", "Preparación iniciada"),
            ("enviar", "enviado", "Pedido enviado"),
            ("entregar", "entregado", "Pedido entregado"),
        ]

        for accion, estado_esperado, desc_esperada in transiciones:
            r = client.post(
                f"/api/v1/pedidos/{pid}/transicion",
                json={"accion": accion},
                headers=auth_admin,
            )
            assert r.status_code == 200, f"Fallo en {accion}: {r.json()}"
            data = r.json()
            assert data["estado"] == estado_esperado, (
                f"Esperaba {estado_esperado} después de {accion}, "
                f"obtuvo {data['estado']}"
            )
            ultimo = data["historial"][-1]
            assert ultimo["estado"] == estado_esperado
            assert ultimo["descripcion"] == desc_esperada

        # Verificar historial completo: 1 (creación) + 4 transiciones = 5
        r = client.get(f"/api/v1/pedidos/{pid}", headers=auth_admin)
        assert r.status_code == 200
        assert len(r.json()["historial"]) == 5

    def test_2_transicion_desde_terminal_rechazada(self, client, auth_admin, pedido_en_pendiente):
        """No se puede transicionar desde estado terminal."""
        pid = pedido_en_pendiente["pedido_id"]

        # Ir a entregado
        for accion in ["pagar", "preparar", "enviar", "entregar"]:
            r = client.post(
                f"/api/v1/pedidos/{pid}/transicion",
                json={"accion": accion},
                headers=auth_admin,
            )
            assert r.status_code == 200

        # Intentar transicionar desde entregado
        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "pagar"},
            headers=auth_admin,
        )
        assert r.status_code == 400
        assert "terminal" in r.json()["detail"].lower()

    def test_3_cliente_cancela_pedido_propio(self, client, auth_cliente, pedido_en_pendiente):
        """Cliente puede cancelar su propio pedido en pendiente."""
        pid = pedido_en_pendiente["pedido_id"]

        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "cancelar"},
            headers=auth_cliente,
        )
        assert r.status_code == 200
        assert r.json()["estado"] == "cancelado"
        assert r.json()["historial"][-1]["descripcion"] == "Pedido cancelado"

    def test_4_cliente_no_paga_pedido(self, client, auth_cliente, pedido_en_pendiente):
        """Cliente NO puede pagar un pedido (requiere admin/sistema)."""
        pid = pedido_en_pendiente["pedido_id"]

        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "pagar"},
            headers=auth_cliente,
        )
        assert r.status_code == 403

    def test_5_accion_invalida_rechazada(self, client, auth_admin, pedido_en_pendiente):
        """Acción inexistente da 400."""
        pid = pedido_en_pendiente["pedido_id"]

        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "inexistente"},
            headers=auth_admin,
        )
        assert r.status_code == 400
        assert "no válida" in r.json()["detail"].lower()

    def test_6_transicion_invalida_rechazada(self, client, auth_admin, pedido_en_pendiente):
        """Transición no permitida desde el estado actual."""
        pid = pedido_en_pendiente["pedido_id"]
        # Pagar primero
        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "pagar"},
            headers=auth_admin,
        )
        assert r.status_code == 200

        # Intentar entregar desde pagado (sin pasar por preparando → enviado)
        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "entregar"},
            headers=auth_admin,
        )
        assert r.status_code == 400
        assert "no está permitida" in r.json()["detail"].lower()

    def test_7_stock_restaurado_al_cancelar(self, client, session, auth_cliente, pedido_en_pendiente):
        """Cancelar restaura el stock."""
        pid = pedido_en_pendiente["pedido_id"]
        prod_id = pedido_en_pendiente["producto_id"]
        stock_inicial = pedido_en_pendiente["stock_inicial"]

        # Verificar stock decrementado (se decrementa al crear, según change 8)
        producto = session.get(Producto, prod_id)
        assert producto.stock == stock_inicial - 2  # 2 = cantidad del item

        # Cancelar
        r = client.post(
            f"/api/v1/pedidos/{pid}/transicion",
            json={"accion": "cancelar"},
            headers=auth_cliente,
        )
        assert r.status_code == 200

        # Verificar stock restaurado
        session.expire_all()
        producto = session.get(Producto, prod_id)
        assert producto.stock == stock_inicial

    def test_8_admin_cancela_en_cualquier_estado_no_terminal(self, client, session, auth_admin, pedido_en_pendiente):
        """Admin puede cancelar desde pendiente, pagado o preparando."""
        # Hacemos 3 pedidos para probar cada estado
        prod = Producto(
            nombre="Producto Cancel Test",
            descripcion="Para test de cancelación",
            price_in_cents=500,
            stock=10,
            is_active=True,
        )
        session.add(prod)
        session.flush()

        for estado_inicial, accion_previa_desc in [
            ("pendiente", []),
            ("pagado", ["pagar"]),
            ("preparando", ["pagar", "preparar"]),
        ]:
            # Crear pedido
            pedido = Pedido(
                cliente_id=pedido_en_pendiente["pedido_id"],  # no importa
                direccion_id=0,
                direccion_snapshot={},
                total=500,
                estado=EstadoPedido.PENDIENTE.value,
            )
            session.add(pedido)
            session.flush()

            item = PedidoItem(
                pedido_id=pedido.id,
                producto_id=prod.id,
                producto_snapshot={},
                cantidad=1,
                precio_unitario=500,
                ingredientes_excluidos=[],
            )
            session.add(item)
            session.add(PedidoHistorial(
                pedido_id=pedido.id,
                estado="pendiente",
                timestamp=datetime.utcnow(),
                usuario_id=None,
                descripcion="Pedido creado",
            ))
            session.commit()

            # Transicionar hasta el estado deseado
            for accion in accion_previa_desc:
                r = client.post(
                    f"/api/v1/pedidos/{pedido.id}/transicion",
                    json={"accion": accion},
                    headers=auth_admin,
                )
                assert r.status_code == 200

            # Cancelar como admin
            r = client.post(
                f"/api/v1/pedidos/{pedido.id}/transicion",
                json={"accion": "cancelar"},
                headers=auth_admin,
            )
            assert r.status_code == 200, (
                f"Admin no pudo cancelar desde {estado_inicial}: {r.json()}"
            )
            assert r.json()["estado"] == "cancelado"

    def test_9_404_si_pedido_no_existe(self, client, auth_admin):
        """Pedido inexistente da 404."""
        r = client.post(
            "/api/v1/pedidos/99999/transicion",
            json={"accion": "pagar"},
            headers=auth_admin,
        )
        assert r.status_code == 404

    def test_10_401_sin_auth(self, client):
        """Sin autenticación da 401."""
        r = client.post(
            "/api/v1/pedidos/1/transicion",
            json={"accion": "pagar"},
        )
        assert r.status_code == 401
