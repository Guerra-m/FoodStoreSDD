"""Test script for customer-profile-and-addresses API endpoints."""
import requests
import sys

BASE = 'http://127.0.0.1:8006'
passed = 0
failed = 0

def test(name, status_code, condition=None):
    global passed, failed
    status = "PASS" if condition else "FAIL"
    if condition:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] {name} (HTTP {status_code})")

# 1. Health check (pre-requisite)
print("\n1. Health Check")
r = requests.get(f'{BASE}/health')
test("Health endpoint", r.status_code, r.status_code == 200 and r.json().get('status') == 'ok')

# 2. Register a test client user
print("\n2. Register Client User")
import random
import string
suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
email = f"test_cliente_{suffix}@test.com"
r = requests.post(f'{BASE}/api/v1/auth/register', json={
    'nombre': 'Test Cliente',
    'email': email,
    'password': 'test123',
    'telefono': '123456789',
})
user_id = r.json().get('id') if r.ok else None
test(f"Register client '{email}'", r.status_code, r.status_code == 201 and user_id is not None)

# 3. Login
print("\n3. Login")
r = requests.post(f'{BASE}/api/v1/auth/login', json={
    'email': email,
    'password': 'test123',
})
access_token = r.json().get('access_token') if r.ok else None
refresh_token = r.json().get('refresh_token') if r.ok else None
test("Login successful", r.status_code, r.status_code == 200 and access_token is not None)

headers = {'Authorization': f'Bearer {access_token}'}

# 4. Get profile (GET /me)
print("\n4. Get Profile (GET /me)")
r = requests.get(f'{BASE}/api/v1/auth/me', headers=headers)
test("Get profile", r.status_code, r.status_code == 200)
test("Profile has new fields",
      r.status_code,
      r.status_code == 200 and 'foto_url' in r.json() and 'fecha_nacimiento' in r.json())
if r.status_code == 200:
    print(f"   Profile: nombre={r.json().get('nombre')}, roles={r.json().get('roles')}")

# 5. Update profile (PATCH /me)
print("\n5. Update Profile (PATCH /me)")
r = requests.patch(f'{BASE}/api/v1/auth/me', headers=headers, json={
    'nombre': 'Cliente Actualizado',
    'telefono': '987654321',
    'foto_url': 'https://example.com/foto.jpg',
    'fecha_nacimiento': '1990-05-15',
})
test("Update profile", r.status_code, r.status_code == 200)
if r.status_code == 200:
    test("Nombre updated", r.status_code, r.json().get('nombre') == 'Cliente Actualizado')
    test("Telefono updated", r.status_code, r.json().get('telefono') == '987654321')
    test("Foto URL updated", r.status_code, r.json().get('foto_url') == 'https://example.com/foto.jpg')

# 6. Try to update email (should be ignored)
print("\n6. Attempt Email Change (should be ignored)")
r = requests.patch(f'{BASE}/api/v1/auth/me', headers=headers, json={
    'email': 'nuevo_email@test.com',
})
test("Email change attempt", r.status_code, r.status_code == 200)
# Email should remain the same
if r.status_code == 200:
    test("Email unchanged", r.status_code, r.json().get('email') == email)

# 7. Create addresses
print("\n7. Create Addresses")
r = requests.post(f'{BASE}/api/v1/clientes/direcciones', headers=headers, json={
    'calle': 'Av. Siempre Viva',
    'numero': '742',
    'ciudad': 'Springfield',
    'provincia': 'Buenos Aires',
    'codigo_postal': '1234',
})
addr1_id = r.json().get('id') if r.ok else None
test("Create address 1", r.status_code, r.status_code == 201 and addr1_id is not None)
if r.status_code == 201:
    test("First address is principal", r.status_code, r.json().get('es_principal') == True)

# Second address
r = requests.post(f'{BASE}/api/v1/clientes/direcciones', headers=headers, json={
    'calle': 'Calle Falsa',
    'numero': '123',
    'ciudad': 'Springfield',
    'provincia': 'Buenos Aires',
    'codigo_postal': '5678',
})
addr2_id = r.json().get('id') if r.ok else None
test("Create address 2", r.status_code, r.status_code == 201 and addr2_id is not None)
test("Second address not principal",
      r.status_code,
      r.status_code == 201 and r.json().get('es_principal') == False)

# 8. List addresses
print("\n8. List Addresses")
r = requests.get(f'{BASE}/api/v1/clientes/direcciones', headers=headers)
test("List addresses", r.status_code, r.status_code == 200)
if r.status_code == 200:
    addrs = r.json()
    test("Has 2 addresses", r.status_code, len(addrs) == 2)
    test("First is principal", r.status_code, addrs[0].get('es_principal') == True)

# 9. Set address 2 as principal
print("\n9. Set Address 2 as Principal")
r = requests.patch(f'{BASE}/api/v1/clientes/direcciones/{addr2_id}/principal', headers=headers)
test("Set principal", r.status_code, r.status_code == 200)
if r.status_code == 200:
    test("Address 2 now principal", r.status_code, r.json().get('es_principal') == True)

# Verify order changed
r = requests.get(f'{BASE}/api/v1/clientes/direcciones', headers=headers)
if r.status_code == 200:
    addrs = r.json()
    test("Address 2 is first in list", r.status_code, addrs[0].get('id') == addr2_id)

# 10. Update address
print("\n10. Update Address")
r = requests.put(f'{BASE}/api/v1/clientes/direcciones/{addr2_id}', headers=headers, json={
    'calle': 'Nueva Calle',
    'numero': '456',
})
test("Update address", r.status_code, r.status_code == 200)
if r.status_code == 200:
    test("Calle updated", r.status_code, r.json().get('calle') == 'Nueva Calle')

# 11. Delete secondary address
print("\n11. Delete Secondary Address")
r = requests.delete(f'{BASE}/api/v1/clientes/direcciones/{addr1_id}', headers=headers)
test("Delete address 1", r.status_code, r.status_code == 204)

# Verify only 1 left
r = requests.get(f'{BASE}/api/v1/clientes/direcciones', headers=headers)
if r.status_code == 200:
    test("Only 1 address left", r.status_code, len(r.json()) == 1)

# 12. Try to delete last address (should fail)
print("\n12. Try to Delete Last Address (should fail)")
r = requests.delete(f'{BASE}/api/v1/clientes/direcciones/{addr2_id}', headers=headers)
test("Cannot delete last address", r.status_code, r.status_code == 400)

# 13. Auth test: try to access without token
print("\n13. Auth Tests")
r = requests.get(f'{BASE}/api/v1/clientes/direcciones')
test("No token = 401", r.status_code, r.status_code == 401)

# 14. Auth isolation test: other user cannot see another's addresses
print("\n14. Address Isolation Test")
suffix2 = ''.join(random.choices(string.ascii_lowercase, k=6))
other_email = f"test_other_{suffix2}@test.com"
r = requests.post(f'{BASE}/api/v1/auth/register', json={
    'nombre': 'Other User',
    'email': other_email,
    'password': 'test123',
})
other_id = r.json().get('id') if r.ok else None
test("Register other user", r.status_code, r.status_code == 201)

r = requests.post(f'{BASE}/api/v1/auth/login', json={
    'email': other_email,
    'password': 'test123',
})
other_token = r.json().get('access_token') if r.ok else None
test("Other user login", r.status_code, r.status_code == 200 and other_token is not None)

# The other user should have 0 addresses
other_headers = {'Authorization': f'Bearer {other_token}'}
r = requests.get(f'{BASE}/api/v1/clientes/direcciones', headers=other_headers)
test("Other user has no addresses", r.status_code, r.status_code == 200 and len(r.json()) == 0)

# Summary
print(f"\n{'='*40}")
print(f"Results: {passed} passed, {failed} failed, {passed+failed} total")
if failed == 0:
    print("ALL TESTS PASSED!")
else:
    print(f"SOME TESTS FAILED!")
    sys.exit(1)
