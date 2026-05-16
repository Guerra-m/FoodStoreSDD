from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List


# === Request Schemas ===

class RegisterRequest(BaseModel):
    """Schema para registro de nuevos usuarios."""
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@example.com",
                "nombre": "Juan García",
                "password": "contraseña_segura_123"
            }
        }


class LoginRequest(BaseModel):
    """Schema para login de usuarios."""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@example.com",
                "password": "contraseña_segura_123"
            }
        }


class RefreshRequest(BaseModel):
    """Schema para renovación de access token."""
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "opaque_token_string_base64"
            }
        }


class LogoutRequest(BaseModel):
    """Schema para logout."""
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "opaque_token_string_base64"
            }
        }


# === Response Schemas ===

class UserResponse(BaseModel):
    """Schema para respuesta de usuario (sin contraseña)."""
    id: int
    email: str
    nombre: str
    roles: List[str] = ["Cliente"]  # Lista de nombres de roles asignados
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    creado_en: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "usuario@example.com",
                "nombre": "Juan García",
                "roles": ["Cliente"],
                "telefono": "+54 11 5555-1234",
                "foto_url": None,
                "fecha_nacimiento": "1990-05-15",
                "creado_en": "2024-05-10T12:00:00Z"
            }
        }


class TokenResponse(BaseModel):
    """Schema para tokens (access + refresh)."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "opaque_token_base64_string",
                "token_type": "bearer",
                "expires_in": 900
            }
        }


class LoginResponse(BaseModel):
    """Schema para respuesta de login exitoso."""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos (duracion del access token)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": 1,
                    "email": "usuario@example.com",
                    "nombre": "Juan García",
                    "roles": ["Cliente"],
                    "creado_en": "2024-05-10T12:00:00Z"
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "opaque_token_base64_string",
                "token_type": "bearer",
                "expires_in": 900
            }
        }


class ProfileUpdateRequest(BaseModel):
    """Schema para actualizar perfil de usuario."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Juan García",
                "telefono": "+54 11 5555-1234",
                "foto_url": "https://ejemplo.com/foto.jpg",
                "fecha_nacimiento": "1990-05-15"
            }
        }


class ErrorResponse(BaseModel):
    """Schema para respuestas de error."""
    detail: str
    status_code: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Invalid credentials",
                "status_code": 401
            }
        }
