from app.core.database import Session, engine

"""
Implementación del patrón Unit of Work (UoW).
Gestiona la transaccionalidad atómica de las operaciones de negocio.
"""

class UnitOfWork:
    def __init__(self):
        # Inicia una nueva sesión de base de datos
        self.session = Session(engine)

    def __enter__(self):
        # Retorna el contexto para su uso en bloques 'with'
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Realiza commit o rollback dependiendo de si ocurrió una excepción
        if exc_type:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()
