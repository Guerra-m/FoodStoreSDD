"""Test script for product-catalog-core API endpoints."""
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

# 1. Health check
print("\n1. Health Check")
r = requests.get(f'{BASE}/health')
test("Health endpoint", r.status_code, r.status_code == 200 and r.json().get('status') == 'ok')

# 2. Create category
print("\n2. Create Category")
r = requests.post(f'{BASE}/api/v1/categorias', json={'nombre': 'Pizzas'})
cat_id = r.json().get('id') if r.ok else None
test(f"Create category 'Pizzas'", r.status_code, r.status_code == 201 and cat_id is not None)
test("Response has product_count", r.status_code, r.ok and 'product_count' in r.json())

# 3. Create ingredient
print("\n3. Create Ingredient")
r = requests.post(f'{BASE}/api/v1/ingredientes', json={
    'nombre': 'Muzzarella', 'unidad_medida': 'kg', 'costo_unitario': 5.0
})
ing_id = r.json().get('id') if r.ok else None
test(f"Create ingredient 'Muzzarella'", r.status_code, r.status_code == 201 and ing_id is not None)

# 4. Create product
print("\n4. Create Product")
product_data = {
    'nombre': 'Pizza Muzzarella',
    'descripcion': 'Pizza clasica con muzzarella',
    'price_in_cents': 1500,
    'stock': 10,
    'is_active': True,
    'categoria_ids': [cat_id] if cat_id else [],
    'ingredientes': [{'ingrediente_id': ing_id, 'cantidad': 0.2}] if ing_id else []
}
r = requests.post(f'{BASE}/api/v1/products', json=product_data)
prod_id = r.json().get('id') if r.ok else None
test("Create product with categories and ingredients", r.status_code, r.status_code == 201 and prod_id is not None)
test("Product has categoria_ids", r.status_code, r.ok and len(r.json().get('categoria_ids', [])) > 0)
test("Product has ingredientes", r.status_code, r.ok and len(r.json().get('ingredientes', [])) > 0)

# 5. List products (admin)
print("\n5. List Products (Admin)")
r = requests.get(f'{BASE}/api/v1/products')
test("List admin products", r.status_code, r.status_code == 200)
if r.ok:
    test("Has productos array", r.status_code, 'productos' in r.json())
    test("Total > 0", r.status_code, r.json().get('total', 0) > 0)

# 6. Public catalog
print("\n6. Public Catalog")
r = requests.get(f'{BASE}/api/v1/products/public')
test("Public catalog endpoint", r.status_code, r.status_code == 200)
if r.ok:
    test("Has productos in response", r.status_code, 'productos' in r.json())

# 7. Public catalog with filters
print("\n7. Public Catalog with Filters")
r = requests.get(f'{BASE}/api/v1/products/public', params={'search': 'pizza'})
test("Filter by search", r.status_code, r.status_code == 200)
if r.ok and cat_id:
    r2 = requests.get(f'{BASE}/api/v1/products/public', params={'categoria_id': cat_id})
    test("Filter by category", r2.status_code, r2.status_code == 200)

# 8. Public product detail
print("\n8. Public Product Detail")
if prod_id:
    r = requests.get(f'{BASE}/api/v1/products/public/{prod_id}')
    test("Public product detail", r.status_code, r.status_code == 200)
    test("Response has ingredientes", r.status_code, r.ok and len(r.json().get('ingredientes', [])) > 0)

# 9. Stock management
print("\n9. Stock Management")
if prod_id:
    # Increment
    r = requests.patch(f'{BASE}/api/v1/products/{prod_id}/stock', json={'action': 'increment', 'value': 5})
    test("Increment stock by 5", r.status_code, r.status_code == 200 and r.json().get('stock') == 15)
    
    # Decrement
    r = requests.patch(f'{BASE}/api/v1/products/{prod_id}/stock', json={'action': 'decrement', 'value': 3})
    test("Decrement stock by 3", r.status_code, r.status_code == 200 and r.json().get('stock') == 12)
    
    # Set
    r = requests.patch(f'{BASE}/api/v1/products/{prod_id}/stock', json={'action': 'set', 'value': 20})
    test("Set stock to 20", r.status_code, r.status_code == 200 and r.json().get('stock') == 20)
    
    # Decrement below zero (should fail)
    r = requests.patch(f'{BASE}/api/v1/products/{prod_id}/stock', json={'action': 'decrement', 'value': 999})
    test("Decrement below 0 returns 400", r.status_code, r.status_code == 400)

# 10. Category with product_count
print("\n10. Category product_count")
r = requests.get(f'{BASE}/api/v1/categorias')
if r.ok:
    for c in r.json().get('categorias', []):
        if c.get('id') == cat_id:
            test(f"Category '{c['nombre']}' has product_count > 0", r.status_code, c.get('product_count', 0) > 0)

# 11. Delete category with products (should fail with 409)
print("\n11. Integrity - Delete category with products")
if cat_id:
    r = requests.delete(f'{BASE}/api/v1/categorias/{cat_id}')
    test("Delete category with products returns 409", r.status_code, r.status_code == 409)

# 12. Delete ingredient with products (should fail with 409)
print("\n12. Integrity - Delete ingredient with products")
if ing_id:
    r = requests.delete(f'{BASE}/api/v1/ingredientes/{ing_id}')
    test("Delete ingredient with products returns 409", r.status_code, r.status_code == 409)

# 13. Delete product (should succeed)
print("\n13. Cleanup - Delete product")
if prod_id:
    r = requests.delete(f'{BASE}/api/v1/products/{prod_id}')
    test("Delete product returns 204", r.status_code, r.status_code == 204)

# 14. Verify product gone from public catalog
print("\n14. Verify product removed from public catalog")
r = requests.get(f'{BASE}/api/v1/products/public')
if r.ok:
    product_ids = [p['id'] for p in r.json().get('productos', [])]
    test("Product no longer in public catalog", r.status_code, prod_id not in product_ids)

# Summary
print(f"\n{'='*40}")
print(f"RESULTS: {passed} passed, {failed} failed out of {passed + failed} tests")
if failed > 0:
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
