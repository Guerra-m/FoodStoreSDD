"""
Script de seed idempotente para datos iniciales del sistema.
Ejecuta: python -m scripts.seed
"""
from sqlmodel import Session, select
from app.core.database import engine
from app.modules.usuarios.model import Usuario as User, Role, UsuarioRole
from app.auth.security import hash_password

ROLES = [
    {"nombre": "Cliente", "descripcion": "Usuario comprador"},
    {"nombre": "Admin", "descripcion": "Administrador del sistema"},
    {"nombre": "Delivery", "descripcion": "Repartidor de pedidos"},
    {"nombre": "Cocinero", "descripcion": "Personal de cocina"},
]

ADMIN_DEFAULT = {
    "nombre": "Admin",
    "email": "admin@foodstore.com",
    "password": "admin123",
    "telefono": None,
}

CLIENTE_DEFAULT = [
    {
        "nombre": "Carlos",
        "email": "cliente@test.com",
        "password": "password123",
        "telefono": "1134567890",
    },
    {
        "nombre": "María",
        "email": "maria@test.com",
        "password": "password123",
        "telefono": "1134567891",
    },
]

COCINERO_DEFAULT = [
    {
        "nombre": "Chef Luis",
        "email": "cocinero@test.com",
        "password": "password123",
        "telefono": "1134567892",
    },
    {
        "nombre": "Chef Ana",
        "email": "ana@test.com",
        "password": "password123",
        "telefono": "1134567893",
    },
]


def seed_roles(session: Session):
    """Crea los roles base si no existen (idempotente)."""
    for role_data in ROLES:
        existing = session.exec(
            select(Role).where(Role.nombre == role_data["nombre"])
        ).first()
        if not existing:
            session.add(Role(**role_data))
            print(f"  [OK] Rol '{role_data['nombre']}' creado")
        else:
            print(f"  - Rol '{role_data['nombre']}' ya existe")
    session.commit()


def _create_user(session: Session, data: dict, role_name: str):
    """Crea un usuario con un rol específico si no existe (idempotente)."""
    existing = session.exec(
        select(User).where(User.email == data["email"])
    ).first()
    if existing:
        print(f"  - Usuario '{data['email']}' ya existe")
        return

    role = session.exec(
        select(Role).where(Role.nombre == role_name)
    ).first()
    if not role:
        print(f"  [ERR] Rol '{role_name}' no encontrado.")
        return

    user = User(
        nombre=data["nombre"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        telefono=data.get("telefono"),
    )
    session.add(user)
    session.flush()

    session.add(UsuarioRole(usuario_id=user.id, role_id=role.id))
    session.commit()
    print(f"  [OK] Usuario '{data['email']}' creado con rol '{role_name}'")


def seed_admin(session: Session):
    """Crea un usuario Admin por defecto si no existe (solo desarrollo)."""
    _create_user(session, ADMIN_DEFAULT, "Admin")


def seed_clientes(session: Session):
    """Crea usuarios Cliente de prueba si no existen."""
    for cliente_data in CLIENTE_DEFAULT:
        _create_user(session, cliente_data, "Cliente")


def seed_cocineros(session: Session):
    """Crea usuarios Cocinero de prueba si no existen."""
    for cocinero_data in COCINERO_DEFAULT:
        _create_user(session, cocinero_data, "Cocinero")


def seed():
    print("[Seed] Sembrando datos iniciales...")
    with Session(engine) as session:
        print("\n[Roles]:")
        seed_roles(session)
        print("\n[Admin]:")
        seed_admin(session)
        print("\n[Clientes]:")
        seed_clientes(session)
        print("\n[Cocineros]:")
        seed_cocineros(session)
    print("\n[OK] Seed completado exitosamente.")


if __name__ == "__main__":
    seed()
