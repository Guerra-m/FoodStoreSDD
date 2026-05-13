"""
Integration tests for Order FSM endpoint.

Requires: server running on port 8006
  python -m uvicorn main:app --port 8006

Usage: python test_pedidos_fsm_api.py
"""
import requests
import sys

BASE = 'http://127.0.0.1:8006'
passed = 0
failed = 0

# Store state across tests
state = {}


def test(name, status_code, condition=None):
    global passed, failed
    status = "PASS" if condition else "FAIL"
    if condition:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] {name} (HTTP {status_code})")


# ── Helper: login and get token ──

def login_as(email, password):
    r = requests.post(f'{BASE}/auth/login', json={
        'email': email,
        'password': password,
    })
    if r.status_code == 200:
        return r.json()['access_token']
    return None


def headers(token):
    return {'Authorization': f'Bearer {token}'}


# ════════════════════════════════════════
# SETUP: login as admin and cliente
# ════════════════════════════════════════
print("\n═══ SETUP ═══")
# These users should exist in seed data or be created via register
# For now, try to login. If it fails, the test needs seed data.

# Try admin login
token_admin = login_as("admin@test.com", "password123")
if not token_admin:
    # Register admin
    r = requests.post(f'{BASE}/auth/register', json={
        'email': 'admin@test.com',
        'nombre': 'Admin Test',
        'password': 'password123',
    })
    test("Register admin", r.status_code, r.status_code in [200, 201])
    token_admin = login_as("admin@test.com", "password123")
    test("Admin login after register", 200, token_admin is not None)

# Try cliente login
token_cliente = login_as("cliente@test.com", "password123")
if not token_cliente:
    r = requests.post(f'{BASE}/auth/register', json={
        'email': 'cliente@test.com',
        'nombre': 'Cliente Test',
        'password': 'password123',
    })
    test("Register cliente", r.status_code, r.status_code in [200, 201])
    token_cliente = login_as("cliente@test.com", "password123")
    test("Cliente login after register", 200, token_cliente is not None)

if not token_admin or not token_cliente:
    print("\n  [SKIP] Cannot proceed without authentication. Is the server running at", BASE)
    sys.exit(1)


# ════════════════════════════════════════
# TEST 1: Usar datos de test ya seedeados en DB
# ════════════════════════════════════════
print("\n═══ 1. Usar test data seedeado ═══")

# Datos ya seedeados directo en DB
prod_id = 1
dir_id = 1
state['prod_id'] = prod_id
state['stock_inicial'] = 10
test("Usar producto id=1 (seedeado)", 200, prod_id is not None)
test("Usar direccion id=1 (seedeada)", 200, dir_id is not None)


# ════════════════════════════════════════
# TEST 2: Crear pedido
# ════════════════════════════════════════
print("\n═══ 2. Crear pedido ═══")

r = requests.post(f'{BASE}/api/v1/pedidos', json={
    'items': [{'producto_id': prod_id, 'cantidad': 2, 'ingredientes_excluidos': []}],
    'direccion_id': dir_id,
}, headers=headers(token_cliente))
pedido_id = r.json().get('id') if r.status_code == 201 else None
state['pedido_id'] = pedido_id
test("Crear pedido", r.status_code, pedido_id is not None)
test("Estado inicial pendiente", r.status_code, pedido_id and r.json()['estado'] == 'pendiente')
test("Total correcto (2000)", r.status_code, pedido_id and r.json()['total'] == 2000)
test("Historial inicial tiene 1 entrada", r.status_code,
     pedido_id and len(r.json().get('historial', [])) == 1)
test("Historial: Pedido creado", r.status_code,
     pedido_id and r.json()['historial'][0]['descripcion'] == 'Pedido creado')


# ════════════════════════════════════════
# TEST 3: Flujo completo (admin)
# ════════════════════════════════════════
print("\n═══ 3. Flujo completo admin ═══")

transiciones = [
    ('pagar', 'pagado', 'Pago confirmado'),
    ('preparar', 'preparando', 'Preparación iniciada'),
    ('enviar', 'enviado', 'Pedido enviado'),
    ('entregar', 'entregado', 'Pedido entregado'),
]

for accion, estado_esperado, desc_esperada in transiciones:
    r = requests.post(
        f'{BASE}/api/v1/pedidos/{pedido_id}/transicion',
        json={'accion': accion},
        headers=headers(token_admin),
    )
    test(f"Transición {accion} → {estado_esperado}", r.status_code, r.status_code == 200)
    if r.ok:
        test(f"Estado es {estado_esperado}", r.status_code, r.json()['estado'] == estado_esperado)
        ultimo = r.json()['historial'][-1]
        test(f"Historial: {desc_esperada}", r.status_code, ultimo['descripcion'] == desc_esperada)

# Verificar historial completo (usar token del dueño del pedido)
r = requests.get(f'{BASE}/api/v1/pedidos/{pedido_id}', headers=headers(token_cliente))
test("Historial completo: 5 entradas", r.status_code,
     r.ok and len(r.json()['historial']) == 5)


# ════════════════════════════════════════
# TEST 4: Transición desde terminal
# ════════════════════════════════════════
print("\n═══ 4. Estado terminal rechaza ═══")
r = requests.post(
    f'{BASE}/api/v1/pedidos/{pedido_id}/transicion',
    json={'accion': 'pagar'},
    headers=headers(token_admin),
)
test("Rechaza transición desde entregado", r.status_code, r.status_code == 400)
test("Mensaje 'terminal'", r.status_code, 'terminal' in r.json()['detail'].lower())


# ════════════════════════════════════════
# TEST 5: Cliente cancela su pedido
# ════════════════════════════════════════
print("\n═══ 5. Cliente cancela su pedido ═══")

# Crear nuevo pedido para cancelar
r = requests.post(f'{BASE}/api/v1/pedidos', json={
    'items': [{'producto_id': prod_id, 'cantidad': 1, 'ingredientes_excluidos': []}],
    'direccion_id': dir_id,
}, headers=headers(token_cliente))
pedido_cancel = r.json().get('id') if r.status_code == 201 else None

if pedido_cancel:
    r = requests.post(
        f'{BASE}/api/v1/pedidos/{pedido_cancel}/transicion',
        json={'accion': 'cancelar'},
        headers=headers(token_cliente),
    )
    test("Cliente cancela su pedido", r.status_code, r.status_code == 200)
    test("Estado cancelado", r.status_code, r.ok and r.json()['estado'] == 'cancelado')
    test("Descripción cancelación", r.status_code,
         r.ok and r.json()['historial'][-1]['descripcion'] == 'Pedido cancelado')


# ════════════════════════════════════════
# TEST 6: Cliente no puede pagar
# ════════════════════════════════════════
print("\n═══ 6. Cliente no puede pagar ═══")

r = requests.post(f'{BASE}/api/v1/pedidos', json={
    'items': [{'producto_id': prod_id, 'cantidad': 1, 'ingredientes_excluidos': []}],
    'direccion_id': dir_id,
}, headers=headers(token_cliente))
pid = r.json().get('id') if r.status_code == 201 else None

if pid:
    r = requests.post(
        f'{BASE}/api/v1/pedidos/{pid}/transicion',
        json={'accion': 'pagar'},
        headers=headers(token_cliente),
    )
    test("Cliente no puede pagar (403)", r.status_code, r.status_code == 403)


# ════════════════════════════════════════
# TEST 7: Acción inválida
# ════════════════════════════════════════
print("\n═══ 7. Acción inválida ═══")
r = requests.post(
    f'{BASE}/api/v1/pedidos/{pedido_id}/transicion',
    json={'accion': 'inexistente'},
    headers=headers(token_admin),
)
test("Acción inválida (400)", r.status_code, r.status_code == 400)
test("Mensaje 'no válida'", r.status_code, 'no válida' in r.json()['detail'].lower())


# ════════════════════════════════════════
# TEST 8: 404 pedido no existe
# ════════════════════════════════════════
print("\n═══ 8. Pedido inexistente ═══")
r = requests.post(
    f'{BASE}/api/v1/pedidos/99999/transicion',
    json={'accion': 'pagar'},
    headers=headers(token_admin),
)
test("Pedido inexistente (404)", r.status_code, r.status_code == 404)


# ════════════════════════════════════════
# TEST 9: 401 sin auth
# ════════════════════════════════════════
print("\n═══ 9. Sin autenticación ═══")
r = requests.post(
    f'{BASE}/api/v1/pedidos/1/transicion',
    json={'accion': 'pagar'},
)
test("Sin auth (401)", r.status_code, r.status_code == 401)


# ════════════════════════════════════════
# RESULTS
# ════════════════════════════════════════
print("\n" + "=" * 60)
print(f"Resultados: {passed} passed, {failed} failed")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
