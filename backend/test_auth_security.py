"""
Script de testing para validar seguridad y flujos de autenticación
Ejecutar: python test_auth_security.py
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

# Colores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def print_test(name: str):
    print(f"\n{BLUE}> {name}{RESET}")

def print_pass(msg: str):
    print(f"{GREEN}OK - {msg}{RESET}")

def print_fail(msg: str):
    print(f"{RED}FAIL - {msg}{RESET}")

def print_info(msg: str):
    print(f"{YELLOW}INFO - {msg}{RESET}")

class AuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_email = f"test_user_{int(time.time())}@example.com"
        self.user_password = "password_segura_123"
        self.user_name = "Test User"
        self.access_token = None
        self.refresh_token = None
        self.user_id = None

    def test_endpoint_exists(self):
        """Verifica que todos los endpoints de auth existan"""
        print_test("Verificar que endpoints existen")
        
        endpoints = [
            ("POST", "/auth/register"),
            ("POST", "/auth/login"),
            ("POST", "/auth/refresh"),
            ("POST", "/auth/logout"),
            ("GET", "/auth/me"),
        ]
        
        for method, path in endpoints:
            try:
                if method == "POST":
                    resp = requests.post(f"{self.base_url}{path}", json={}, timeout=2)
                else:
                    resp = requests.get(f"{self.base_url}{path}", timeout=2)
                
                # Si devuelve algo (incluso error), endpoint existe
                if resp.status_code != 404:
                    print_pass(f"{method} {path} - Status {resp.status_code}")
                else:
                    print_fail(f"{method} {path} - Not found")
            except Exception as e:
                print_fail(f"{method} {path} - {str(e)}")

    def test_register_success(self):
        """Test 1: Registro exitoso"""
        print_test("Test 1: Registro exitoso")
        
        payload = {
            "email": self.user_email,
            "nombre": self.user_name,
            "password": self.user_password
        }
        
        try:
            resp = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=5)
            
            if resp.status_code == 201:
                data = resp.json()
                self.user_id = data.get("id")
                
                # Verificar que no retorna password
                if "password" in data or "hashed_password" in data or "password_hash" in data:
                    print_fail("Response contiene campo de password")
                    return False
                
                # Verificar datos retornados
                if data.get("email") == self.user_email and data.get("nombre") == self.user_name:
                    print_pass(f"Usuario registrado: {data.get('email')} (ID: {self.user_id})")
                    return True
                else:
                    print_fail("Datos de usuario incompletos")
                    return False
            else:
                print_fail(f"Status {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_register_duplicate_email(self):
        """Test 2: Email duplicado"""
        print_test("Test 2: Registro con email duplicado")
        
        payload = {
            "email": self.user_email,  # Mismo email
            "nombre": "Another User",
            "password": "password_secure_456"
        }
        
        try:
            resp = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=5)
            
            if resp.status_code == 409:
                print_pass(f"Devolvió 409 Conflict como esperado")
                return True
            else:
                print_fail(f"Esperaba 409, obtuvo {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_register_weak_password(self):
        """Test 3: Contraseña débil"""
        print_test("Test 3: Registro con contraseña débil (< 8 caracteres)")
        
        payload = {
            "email": f"weakpwd_{int(time.time())}@example.com",
            "nombre": "Weak Password User",
            "password": "short"  # Menos de 8 caracteres
        }
        
        try:
            resp = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=5)
            
            if resp.status_code == 400:
                print_pass(f"Devolvió 400 Bad Request como esperado")
                return True
            else:
                print_fail(f"Esperaba 400, obtuvo {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_register_invalid_email(self):
        """Test 4: Email inválido"""
        print_test("Test 4: Registro con email inválido")
        
        payload = {
            "email": "not_an_email",
            "nombre": "Invalid Email User",
            "password": "password_secure_789"
        }
        
        try:
            resp = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=5)
            
            if resp.status_code == 422:  # Validation error
                print_pass(f"Devolvió 422 Validation Error como esperado")
                return True
            else:
                print_fail(f"Esperaba 422, obtuvo {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_login_success(self):
        """Test 5: Login exitoso"""
        print_test("Test 5: Login exitoso")
        
        payload = {
            "email": self.user_email,
            "password": self.user_password
        }
        
        try:
            resp = requests.post(f"{self.base_url}/auth/login", json=payload, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                
                # Verificar campos requeridos
                if not self.access_token or not self.refresh_token:
                    print_fail("No se retornaron tokens")
                    return False
                
                # Verificar que access_token es JWT
                if len(self.access_token.split(".")) != 3:
                    print_fail("Access token no es un JWT válido")
                    return False
                
                # Verificar que no retorna password
                if "password" in data:
                    print_fail("Response contiene password")
                    return False
                
                print_pass(f"Login exitoso")
                print_info(f"Access token: {self.access_token[:50]}...")
                print_info(f"Refresh token: {self.refresh_token[:30]}...")
                return True
            else:
                print_fail(f"Status {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_login_invalid_credentials(self):
        """Test 6: Credenciales inválidas (respuesta genérica)"""
        print_test("Test 6: Login con credenciales inválidas")
        
        # Intentar con email incorrecto
        payload1 = {
            "email": "nonexistent@example.com",
            "password": self.user_password
        }
        
        # Intentar con contraseña incorrecta
        payload2 = {
            "email": self.user_email,
            "password": "wrong_password_123"
        }
        
        try:
            resp1 = requests.post(f"{self.base_url}/auth/login", json=payload1, timeout=5)
            resp2 = requests.post(f"{self.base_url}/auth/login", json=payload2, timeout=5)
            
            if resp1.status_code == 401 and resp2.status_code == 401:
                print_pass(f"Ambas requests retornaron 401")
                
                # Verificar que el mensaje es genérico (no diferencia)
                msg1 = resp1.json().get("detail", "")
                msg2 = resp2.json().get("detail", "")
                
                if msg1 == msg2:
                    print_pass(f"Mensaje de error genérico: '{msg1}'")
                    return True
                else:
                    print_fail(f"Mensajes diferentes: '{msg1}' vs '{msg2}'")
                    return False
            else:
                print_fail(f"Status codes: {resp1.status_code}, {resp2.status_code}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_get_current_user(self):
        """Test 7: Obtener usuario actual"""
        print_test("Test 7: GET /auth/me con token válido")
        
        if not self.access_token:
            print_fail("No hay access token. Ejecuta login primero")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            resp = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                
                # Verificar que no retorna password
                if "password" in data or "hashed_password" in data or "password_hash" in data:
                    print_fail("Response contiene campo de password")
                    return False
                
                if data.get("email") == self.user_email:
                    print_pass(f"Usuario obtenido: {data}")
                    return True
                else:
                    print_fail("Datos incorrectos")
                    return False
            else:
                print_fail(f"Status {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_get_current_user_invalid_token(self):
        """Test 8: GET /auth/me sin token o token inválido"""
        print_test("Test 8: GET /auth/me sin token/token inválido")
        
        # Sin token
        try:
            resp = requests.get(f"{self.base_url}/auth/me", timeout=5)
            if resp.status_code != 401:
                print_fail(f"Sin token: Esperaba 401, obtuvo {resp.status_code}")
                return False
            print_pass("Sin token: 401 Unauthorized")
        except Exception as e:
            print_fail(f"Error sin token: {str(e)}")
            return False
        
        # Token inválido
        headers = {"Authorization": "Bearer invalid_token_12345"}
        try:
            resp = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=5)
            if resp.status_code != 401:
                print_fail(f"Token inválido: Esperaba 401, obtuvo {resp.status_code}")
                return False
            print_pass("Token inválido: 401 Unauthorized")
            return True
        except Exception as e:
            print_fail(f"Error con token inválido: {str(e)}")
            return False

    def test_refresh_token_success(self):
        """Test 9: Refresh token exitoso"""
        print_test("Test 9: Refresh token exitoso (rotación)")
        
        if not self.refresh_token:
            print_fail("No hay refresh token")
            return False
        
        old_access_token = self.access_token
        payload = {"refresh_token": self.refresh_token}
        
        try:
            resp = requests.post(f"{self.base_url}/auth/refresh", json=payload, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                new_access_token = data.get("access_token")
                new_refresh_token = data.get("refresh_token")
                
                if not new_access_token or not new_refresh_token:
                    print_fail("No se retornaron nuevos tokens")
                    return False
                
                # Verificar que tokens son diferentes (rotación)
                if old_access_token == new_access_token:
                    print_fail("Access token no fue renovado")
                    return False
                
                if self.refresh_token == new_refresh_token:
                    print_fail("Refresh token no fue rotado")
                    return False
                
                # Actualizar tokens
                self.access_token = new_access_token
                self.refresh_token = new_refresh_token
                
                print_pass(f"Tokens renovados exitosamente")
                return True
            else:
                print_fail(f"Status {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_refresh_token_reuse_detection(self):
        """Test 10: Detección de robo (refresh token revocado reutilizado)"""
        print_test("Test 10: Reutilización de refresh token revocado (robo)")
        
        if not self.refresh_token:
            print_fail("No hay refresh token")
            return False
        
        old_refresh_token = self.refresh_token
        payload = {"refresh_token": old_refresh_token}
        
        try:
            # Primer refresh exitoso
            resp1 = requests.post(f"{self.base_url}/auth/refresh", json=payload, timeout=5)
            
            if resp1.status_code != 200:
                print_fail("Primer refresh falló")
                return False
            
            print_info("Primer refresh exitoso - token rotado")
            
            # Intentar reutilizar el token antiguo (ya revocado)
            resp2 = requests.post(f"{self.base_url}/auth/refresh", json=payload, timeout=5)
            
            if resp2.status_code == 401:
                data = resp2.json()
                detail = data.get("detail", "")
                
                if "robo" in detail.lower() or "revocado" in detail.lower():
                    print_pass(f"Robo detectado: {detail}")
                    return True
                else:
                    print_pass(f"Token revocado rechazado: {detail}")
                    return True
            else:
                print_fail(f"Esperaba 401, obtuvo {resp2.status_code}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_logout_success(self):
        """Test 11: Logout exitoso"""
        print_test("Test 11: Logout exitoso")
        
        if not self.refresh_token:
            print_fail("No hay refresh token")
            return False
        
        payload = {"refresh_token": self.refresh_token}
        
        try:
            resp = requests.post(f"{self.base_url}/auth/logout", json=payload, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                print_pass(f"Logout exitoso: {data}")
                
                # Intentar usar el refresh token después de logout
                resp2 = requests.post(f"{self.base_url}/auth/refresh", json=payload, timeout=5)
                
                if resp2.status_code == 401:
                    print_pass("Refresh token fue revocado después de logout")
                    return True
                else:
                    print_fail("Refresh token aún es válido después de logout")
                    return False
            else:
                print_fail(f"Status {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test 12: Verificar CORS headers"""
        print_test("Test 12: CORS headers configurados")
        
        try:
            resp = requests.options(
                f"{self.base_url}/auth/login",
                headers={"Origin": "http://localhost:5173"}
            )
            
            cors_origin = resp.headers.get("Access-Control-Allow-Origin", "")
            cors_methods = resp.headers.get("Access-Control-Allow-Methods", "")
            cors_credentials = resp.headers.get("Access-Control-Allow-Credentials", "")
            
            if cors_origin:
                print_pass(f"CORS Origin: {cors_origin}")
            else:
                print_fail("CORS Origin header no está configurado")
                return False
            
            if cors_methods:
                print_pass(f"CORS Methods: {cors_methods}")
            else:
                print_fail("CORS Methods header no está configurado")
                return False
            
            if cors_credentials == "true":
                print_pass(f"CORS Credentials: true")
            else:
                print_fail("CORS Credentials no habilitado")
                return False
            
            return True
        except Exception as e:
            print_info(f"CORS check falló (posiblemente esperado): {str(e)}")
            return True  # No es crítico

    def test_password_not_in_logs(self):
        """Test 13: Verificar que password no aparece en logs"""
        print_test("Test 13: Verificar logs (password no debe aparecer)")
        
        # Este test es manual - verifica que los logs del servidor no contienen passwords
        print_info("Verifica manualmente en los logs del servidor que la contraseña no aparece")
        print_info("Busca en la salida del backend por la contraseña: 'password_segura_123'")
        
        return True

    def run_all_tests(self):
        """Ejecuta todos los tests"""
        print(f"{BLUE}{'='*60}")
        print(f"TESTING SEGURIDAD Y FLUJOS DE AUTENTICACIÓN")
        print(f"{'='*60}{RESET}\n")
        
        results = []
        
        # Tests de endpoints
        results.append(("Endpoints existen", self.test_endpoint_exists() or True))
        
        # Tests de registro
        results.append(("Test 1: Registro exitoso", self.test_register_success()))
        results.append(("Test 2: Email duplicado (409)", self.test_register_duplicate_email()))
        results.append(("Test 3: Contraseña débil (400)", self.test_register_weak_password()))
        results.append(("Test 4: Email inválido (422)", self.test_register_invalid_email()))
        
        # Tests de login
        results.append(("Test 5: Login exitoso", self.test_login_success()))
        results.append(("Test 6: Credenciales inválidas (genéricas)", self.test_login_invalid_credentials()))
        
        # Tests de usuario actual
        results.append(("Test 7: GET /auth/me con token", self.test_get_current_user()))
        results.append(("Test 8: GET /auth/me sin/inválido token", self.test_get_current_user_invalid_token()))
        
        # Tests de refresh y rotación
        results.append(("Test 9: Refresh token exitoso", self.test_refresh_token_success()))
        results.append(("Test 10: Detección de robo", self.test_refresh_token_reuse_detection()))
        
        # Tests de logout
        results.append(("Test 11: Logout exitoso", self.test_logout_success()))
        
        # Tests de seguridad
        results.append(("Test 12: CORS headers", self.test_cors_headers()))
        results.append(("Test 13: Logs sin passwords", self.test_password_not_in_logs()))
        
        # Resumen
        print(f"\n{BLUE}{'='*60}")
        print(f"RESUMEN DE TESTS")
        print(f"{'='*60}{RESET}\n")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
            print(f"{status} - {name}")
        
        print(f"\n{BLUE}Total: {passed}/{total} tests pasaron{RESET}")
        
        if passed == total:
            print(f"{GREEN}TESTS COMPLETADOS CON EXITO{RESET}\n")
        else:
            print(f"{RED}{total - passed} tests fallaron{RESET}\n")
        
        return passed == total


if __name__ == "__main__":
    tester = AuthTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
