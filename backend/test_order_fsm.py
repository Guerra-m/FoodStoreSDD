"""
Unit tests for OrderFSM - Finite State Machine for order state transitions.

Self-contained: no app imports needed, FSM class is embedded here
to avoid SQLModel registry conflicts (Usuario vs User table).

EjecuciÃ³n: python test_order_fsm.py  (no requiere server)
"""
import sys

passed = 0
failed = 0


def test(name, condition):
    global passed, failed
    if condition:
        passed += 1
        sys.stdout.write(f"  [PASS] {name}\n")
    else:
        failed += 1
        sys.stdout.write(f"  [FAIL] {name}\n")


# â”€â”€ OrderFSM class (copied for standalone testing) â”€â”€â”€â”€â”€
from typing import Dict, List, Optional


class OrderFSM:
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
        "entregado": {},
        "cancelado": {},
    }

    VALID_ACTIONS: List[str] = ["pagar", "preparar", "enviar", "entregar", "cancelar"]
    TERMINAL_STATES: List[str] = ["entregado", "cancelado"]

    @classmethod
    def can_transition(cls, current_state: str, action: str) -> bool:
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        return action in state_actions

    @classmethod
    def get_next_state(cls, current_state: str, action: str) -> Optional[str]:
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        result = state_actions.get(action)
        return result[0] if result else None

    @classmethod
    def get_allowed_actions(cls, current_state: str, user_role: str) -> List[str]:
        state_actions = cls.TRANSITION_MAP.get(current_state, {})
        return [a for a, (_, roles) in state_actions.items() if user_role in roles]

    @classmethod
    def is_action_valid(cls, action: str) -> bool:
        return action in cls.VALID_ACTIONS

    @classmethod
    def is_terminal_state(cls, state: str) -> bool:
        return state in cls.TERMINAL_STATES

    @classmethod
    def get_description_for_action(cls, action: str, current_state: str) -> str:
        descriptions = {
            "pagar": "Pago confirmado",
            "preparar": "PreparaciÃ³n iniciada",
            "enviar": "Pedido enviado",
            "entregar": "Pedido entregado",
            "cancelar": "Pedido cancelado",
        }
        base = descriptions.get(action, f"TransiciÃ³n '{action}'")
        if action == "cancelar":
            if current_state == "pagado":
                return "Pedido cancelado (pagado)"
            if current_state == "preparando":
                return "Pedido cancelado (en preparaciÃ³n)"
        return base


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
print("\n" + "=" * 60)
print("OrderFSM Unit Tests")
print("=" * 60)

# 1. can_transition - vÃ¡lidas
print("\n1. can_transition - Transiciones vÃ¡lidas")
test("pendiente â†’ pagar", OrderFSM.can_transition("pendiente", "pagar"))
test("pendiente â†’ cancelar", OrderFSM.can_transition("pendiente", "cancelar"))
test("pagado â†’ preparar", OrderFSM.can_transition("pagado", "preparar"))
test("pagado â†’ cancelar", OrderFSM.can_transition("pagado", "cancelar"))
test("preparando â†’ enviar", OrderFSM.can_transition("preparando", "enviar"))
test("preparando â†’ cancelar", OrderFSM.can_transition("preparando", "cancelar"))
test("enviado â†’ entregar", OrderFSM.can_transition("enviado", "entregar"))

# 2. can_transition - invÃ¡lidas
print("\n2. can_transition - Transiciones invÃ¡lidas")
test("pendiente â†’ enviar (invÃ¡lida)", not OrderFSM.can_transition("pendiente", "enviar"))
test("pendiente â†’ entregar (invÃ¡lida)", not OrderFSM.can_transition("pendiente", "entregar"))
test("pendiente â†’ preparar (invÃ¡lida)", not OrderFSM.can_transition("pendiente", "preparar"))
test("pagado â†’ entregar (invÃ¡lida)", not OrderFSM.can_transition("pagado", "entregar"))
test("cancelado â†’ cualquier (invÃ¡lida)", not OrderFSM.can_transition("cancelado", "pagar"))
test("entregado â†’ cualquier (invÃ¡lida)", not OrderFSM.can_transition("entregado", "cancelar"))
test("acciÃ³n inexistente", not OrderFSM.can_transition("pendiente", "volver"))

# 3. get_next_state
print("\n3. get_next_state - Estado destino correcto")
test("pendiente+pagar â†’ pagado", OrderFSM.get_next_state("pendiente", "pagar") == "pagado")
test("pendiente+cancelar â†’ cancelado", OrderFSM.get_next_state("pendiente", "cancelar") == "cancelado")
test("pagado+preparar â†’ preparando", OrderFSM.get_next_state("pagado", "preparar") == "preparando")
test("pagado+cancelar â†’ cancelado", OrderFSM.get_next_state("pagado", "cancelar") == "cancelado")
test("preparando+enviar â†’ enviado", OrderFSM.get_next_state("preparando", "enviar") == "enviado")
test("preparando+cancelar â†’ cancelado", OrderFSM.get_next_state("preparando", "cancelar") == "cancelado")
test("enviado+entregar â†’ entregado", OrderFSM.get_next_state("enviado", "entregar") == "entregado")
test("transiciÃ³n invÃ¡lida â†’ None", OrderFSM.get_next_state("entregado", "pagar") is None)

# 4. get_allowed_actions
print("\n4. get_allowed_actions - Acciones por rol")
cliente_pendiente = OrderFSM.get_allowed_actions("pendiente", "Cliente")
test("Cliente en pendiente puede cancelar", "cancelar" in cliente_pendiente)
test("Cliente en pendiente NO puede pagar", "pagar" not in cliente_pendiente)
test("Cliente en pendiente: solo 1 acciÃ³n", len(cliente_pendiente) == 1)

admin_pendiente = OrderFSM.get_allowed_actions("pendiente", "Admin")
test("Admin en pendiente puede pagar", "pagar" in admin_pendiente)
test("Admin en pendiente puede cancelar", "cancelar" in admin_pendiente)
test("Admin en pendiente: 2 acciones", len(admin_pendiente) == 2)

admin_pagado = OrderFSM.get_allowed_actions("pagado", "Admin")
test("Admin en pagado puede preparar", "preparar" in admin_pagado)
test("Admin en pagado puede cancelar", "cancelar" in admin_pagado)
test("Admin en pagado: 2 acciones", len(admin_pagado) == 2)

test("Cliente en pagado: 0 acciones", len(OrderFSM.get_allowed_actions("pagado", "Cliente")) == 0)
test("Admin en entregado: 0 acciones", len(OrderFSM.get_allowed_actions("entregado", "Admin")) == 0)
test("Admin en cancelado: 0 acciones", len(OrderFSM.get_allowed_actions("cancelado", "Admin")) == 0)

sistema_pendiente = OrderFSM.get_allowed_actions("pendiente", "Sistema")
test("Sistema en pendiente puede pagar", "pagar" in sistema_pendiente)
test("Sistema en pendiente: solo 1 acciÃ³n", len(sistema_pendiente) == 1)

# 5. is_terminal_state
print("\n5. is_terminal_state")
test("entregado es terminal", OrderFSM.is_terminal_state("entregado"))
test("cancelado es terminal", OrderFSM.is_terminal_state("cancelado"))
test("pendiente NO es terminal", not OrderFSM.is_terminal_state("pendiente"))
test("pagado NO es terminal", not OrderFSM.is_terminal_state("pagado"))
test("preparando NO es terminal", not OrderFSM.is_terminal_state("preparando"))
test("enviado NO es terminal", not OrderFSM.is_terminal_state("enviado"))

# 6. is_action_valid
print("\n6. is_action_valid")
test("pagar es vÃ¡lida", OrderFSM.is_action_valid("pagar"))
test("cancelar es vÃ¡lida", OrderFSM.is_action_valid("cancelar"))
test("volver NO es vÃ¡lida", not OrderFSM.is_action_valid("volver"))
test("vacÃ­o NO es vÃ¡lida", not OrderFSM.is_action_valid(""))

# 7. Descripciones
print("\n7. Descripciones de transiciÃ³n")
test("pagar â†’ Pago confirmado", OrderFSM.get_description_for_action("pagar", "pendiente") == "Pago confirmado")
test("cancelar pendiente", OrderFSM.get_description_for_action("cancelar", "pendiente") == "Pedido cancelado")
test("cancelar pagado", OrderFSM.get_description_for_action("cancelar", "pagado") == "Pedido cancelado (pagado)")
test("cancelar preparando", OrderFSM.get_description_for_action("cancelar", "preparando") == "Pedido cancelado (en preparaciÃ³n)")
test("entregar", OrderFSM.get_description_for_action("entregar", "enviado") == "Pedido entregado")

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
print("\n" + "=" * 60)
print(f"Resultados: {passed} passed, {failed} failed")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
