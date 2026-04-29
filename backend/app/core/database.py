from sqlmodel import create_engine, Session
from app.core.config import settings

"""
Configuración de la conexión a la base de datos utilizando SQLModel.
"""

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    """
    Generador para obtener una sesión de base de datos.
    Cierra la sesión automáticamente al finalizar la operación.
    """
    with Session(engine) as session:
        yield session
