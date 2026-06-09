"""
Constantes de roles del sistema.
Estos son los roles base que pueden asignarse a usuarios.
"""

# Roles del sistema
ROLE_CLIENTE = "Cliente"
ROLE_ADMIN = "Admin"
ROLE_DELIVERY = "Delivery"
ROLE_COCINERO = "Cocinero"

# Lista de todos los roles
ALL_ROLES = [ROLE_CLIENTE, ROLE_ADMIN, ROLE_DELIVERY, ROLE_COCINERO]

# Mapeo de rol a descripción
ROLE_DESCRIPTIONS = {
    ROLE_CLIENTE: "Usuario cliente de la plataforma",
    ROLE_ADMIN: "Administrador del sistema",
    ROLE_DELIVERY: "Personal de entrega",
    ROLE_COCINERO: "Personal de cocina",
}
