import os
from pydantic_settings import BaseSettings

"""
Configuración global del sistema.
Utiliza Pydantic Settings para gestionar variables de entorno de forma tipada.
"""

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/foodstore_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-min-32-chars")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

# Instancia global de configuración
settings = Settings()
