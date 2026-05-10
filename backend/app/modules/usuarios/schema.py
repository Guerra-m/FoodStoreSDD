from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """Schema para registro de nuevo usuario."""
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None


class LoginRequest(BaseModel):
    """Schema para inicio de sesión."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema con tokens de acceso y refresco."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Schema para refrescar el access token."""
    refresh_token: str


class UserResponse(BaseModel):
    """Schema público del usuario (sin password)."""
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    roles: List[str] = []
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class ClientePerfilUpdate(BaseModel):
    """Schema para actualización de perfil del cliente."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
