"""
Script de seed idempotente para datos iniciales del sistema.
Ejecuta: python -m scripts.seed
"""
from sqlmodel import Session, select
from app.core.database import engine
from app.modules.usuarios.model import Usuario, Role, UsuarioRole
from app.core.security import hash_password

ROLES = [
    {"nombre": "Cliente", "descripcion": "Usuario comprador"},
    {"nombre": "Admin", "descripcion": "Administrador del sistema"},
    {"nombre": "Delivery", "descripcion": "Repartidor de pedidos"},
]

ADMIN_DEFAULT = {
    "nombre": "Admin",
    "email": "admin@foodstore.com",
    "password": "admin123",
    "telefono": None,
}


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


def seed_admin(session: Session):
    """Crea un usuario Admin por defecto si no existe (solo desarrollo)."""
    existing = session.exec(
        select(Usuario).where(Usuario.email == ADMIN_DEFAULT["email"])
    ).first()
    if existing:
        print("  - Usuario Admin ya existe")
        return

    admin_role = session.exec(
        select(Role).where(Role.nombre == "Admin")
    ).first()
    if not admin_role:
        print("  [ERR] Rol Admin no encontrado. Ejecutar seed_roles primero.")
        return

    admin = Usuario(
        nombre=ADMIN_DEFAULT["nombre"],
        email=ADMIN_DEFAULT["email"],
        password_hash=hash_password(ADMIN_DEFAULT["password"]),
        telefono=ADMIN_DEFAULT["telefono"],
    )
    session.add(admin)
    session.flush()

    session.add(UsuarioRole(usuario_id=admin.id, role_id=admin_role.id))
    session.commit()
    print(f"  [OK] Usuario Admin creado (email: {ADMIN_DEFAULT['email']})")


def seed():
    print("[Seed] Sembrando datos iniciales...")
    with Session(engine) as session:
        print("\n[Roles]:")
        seed_roles(session)
        print("\n[Admin]:")
        seed_admin(session)
    print("\n[OK] Seed completado exitosamente.")


if __name__ == "__main__":
    seed()
