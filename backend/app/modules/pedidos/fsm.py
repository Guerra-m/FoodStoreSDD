"""
FSM (Finite State Machine) para el ciclo de vida de pedidos.

Define el mapa de transiciones válidas, las reglas de autorización por rol,
y los estados terminales del sistema.
"""
from typing import Dict, List, Optional


class OrderFSM:
    """
    Máquina de estados finitos para gestionar las transiciones de un pedido.

    Estados: pendiente, pagado, preparando, enviado, entregado, cancelado
    Acciones: pagar, preparar, enviar, entregar, cancelar

    El mapa de transiciones define qué acción lleva de un estado a otro,
    y qué roles están autorizados para ejecutar cada acción desde cada estado.
    """

    # Mapa de transiciones: {estado_actual: {accion: (estado_destino, [roles_autorizados])}}
    # Los roles son: "Cliente", "Admin", "Sistema"
    TRANSITION_MAP: Dict[str, Dict[str, tuple]] = {
        "pendiente": {
            "pagar": ("pagado", ["Admin", "Sistema"]),
            "cancelar": ("cancelado", ["Cliente", "Admin"]),
        },
        "pagado": {
            "preparar": ("preparando", ["Admin"]),
            "cancelar": ("cancelado", ["Admin"]),
        },
        "preparando": {
            "enviar": ("enviado", ["Admin"]),
            "cancelar": ("cancelado", ["Admin"]),
        },
        "enviado": {
            "entregar": ("entregado", ["Admin"]),
        },
        "entregado": {},  # Terminal
        "cancelado": {},  # Terminal
    }

    # Acciones válidas para referencia
    VALID_ACTIONS: List[str] = ["pagar", "preparar", "enviar", "entregar", "cancelar"]

    # Estados terminales (no admiten más transiciones)
    TERMINAL_STATES: List[str] = ["entregado", "cancelado"]

    @classmethod
    def can_transition(cls, current_state: str, action: str) -> bool:
        """
        Verifica si una acción está permitida desde el estado actual.

        Args:
            current_state: Estado actual del pedido.
            action: Acción a ejecutar.

        Returns:
            True si la transición es válida, False en caso contrario.
        """
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        return action in state_actions

    @classmethod
    def get_next_state(cls, current_state: str, action: str) -> Optional[str]:
        """
        Obtiene el estado destino para una transición dada.

        Args:
            current_state: Estado actual del pedido.
            action: Acción a ejecutar.

        Returns:
            El estado destino si la transición es válida, None en caso contrario.
        """
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        result = state_actions.get(action)
        if result:
            return result[0]
        return None

    @classmethod
    def get_allowed_actions(cls, current_state: str, user_role: str) -> List[str]:
        """
        Retorna las acciones disponibles para un rol desde un estado dado.

        Args:
            current_state: Estado actual del pedido.
            user_role: Rol del usuario ("Cliente", "Admin", "Sistema").

        Returns:
            Lista de acciones permitidas para ese rol desde ese estado.
        """
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        allowed = []
        for action, (_, allowed_roles) in state_actions.items():
            if user_role in allowed_roles:
                allowed.append(action)
        return allowed

    @classmethod
    def is_action_valid(cls, action: str) -> bool:
        """
        Verifica si una acción existe en el sistema.

        Args:
            action: Nombre de la acción a validar.

        Returns:
            True si la acción es reconocida, False en caso contrario.
        """
        return action in cls.VALID_ACTIONS

    @classmethod
    def is_terminal_state(cls, state: str) -> bool:
        """
        Verifica si un estado es terminal (no admite más transiciones).

        Args:
            state: Estado a verificar.

        Returns:
            True si es un estado terminal, False en caso contrario.
        """
        return state in cls.TERMINAL_STATES

    @classmethod
    def get_description_for_action(cls, action: str, current_state: str) -> str:
        """
        Genera una descripción legible para una transición.

        Args:
            action: Acción ejecutada.
            current_state: Estado desde el que se transiciona.

        Returns:
            Descripción textual de la transición.
        """
        descriptions = {
            "pagar": "Pago confirmado",
            "preparar": "Preparación iniciada",
            "enviar": "Pedido enviado",
            "entregar": "Pedido entregado",
            "cancelar": "Pedido cancelado",
        }
        base = descriptions.get(action, f"Transición '{action}'")
        if action == "cancelar" and current_state == "pagado":
            return "Pedido cancelado (pagado)"
        if action == "cancelar" and current_state == "preparando":
            return "Pedido cancelado (en preparación)"
        return base
