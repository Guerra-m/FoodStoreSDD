import os
from pydantic_settings import BaseSettings

"""
Configuración global del sistema.
Utiliza Pydantic Settings para gestionar variables de entorno de forma tipada.
"""

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/foodstore_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-min-32-chars")
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    
    # JWT Configuration for Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-jwt-secret-key-min-32-chars-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # MercadoPago Integration
    MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN", "")
    MP_PUBLIC_KEY: str = os.getenv("MP_PUBLIC_KEY", "")
    MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET", "")

    class Config:
        env_file = ".env"

# Instancia global de configuración
settings = Settings()
