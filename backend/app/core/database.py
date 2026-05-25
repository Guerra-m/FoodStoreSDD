from sqlmodel import create_engine, Session
from app.core.config import settings

"""
Configuración de la conexión a la base de datos utilizando SQLModel.
Soporta tanto PostgreSQL como SQLite.
"""

_connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args)

def get_session():
    """
    Generador para obtener una sesión de base de datos.
    Cierra la sesión automáticamente al finalizar la operación.
    """
    with Session(engine) as session:
        yield session
