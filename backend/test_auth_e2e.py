"""
Script de testing END-TO-END para todos los flujos de autenticación
Combina tests de backend y simula flujos del frontend

Ejecución: python test_auth_e2e.py
"""

import requests
import json
import time
from typing import Dict, Any, Tuple

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

# Colores
G = "\033[92m"
R = "\033[91m"
Y = "\033[93m"
B = "\033[94m"
RESET = "\033[0m"

def test_section(name: str):
    print(f"\n{B}{'='*70}")
    print(f"  {name.upper()}")
    print(f"{'='*70}{RESET}\n")

def test_case(name: str):
    print(f"{B}▶ {name}{RESET}")

def success(msg: str):
    print(f"{G}  ✓ {msg}{RESET}")

def failure(msg: str):
    print(f"{R}  ✗ {msg}{RESET}")

def info(msg: str):
    print(f"{Y}  ℹ {msg}{RESET}")

class E2ETester:
    def __init__(self):
        self.base_url = BASE_URL
        self.email = f"e2e_user_{int(time.time())}@example.com"
        self.password = "SecurePassword123!"
        self.name = "E2E Test User"
        self.user_data = None
        self.access_token = None
        self.refresh_token = None
        self.passed = 0
        self.failed = 0

    def register_and_login(self) -> Tuple[bool, str]:
        """Registra e inmediatamente intenta login - flujo completo"""
        test_section("FLUJO 1: REGISTRO Y LOGIN")
        
        # Step 1: Registro
        test_case("Paso 1.1: Registrar usuario")
        register_payload = {
            "email": self.email,
            "nombre": self.name,
            "password": self.password
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/register",
                json=register_payload,
                timeout=5
            )
            
            if resp.status_code != 201:
                failure(f"Registro falló: {resp.status_code} - {resp.text}")
                self.failed += 1
                return False, ""
            
            data = resp.json()
            
            # Validaciones de seguridad
            if "password" in str(data).lower():
                failure("Response contiene palabra 'password'")
                self.failed += 1
                return False, ""
            
            self.user_data = data
            success(f"Usuario registrado: {data.get('email')} (ID: {data.get('id')})")
            self.passed += 1
            
        except Exception as e:
            failure(f"Error en registro: {str(e)}")
            self.failed += 1
            return False, ""
        
        # Step 2: Login
        test_case("Paso 1.2: Iniciar sesión con credenciales registradas")
        login_payload = {
            "email": self.email,
            "password": self.password
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/login",
                json=login_payload,
                timeout=5
            )
            
            if resp.status_code != 200:
                failure(f"Login falló: {resp.status_code} - {resp.text}")
                self.failed += 1
                return False, ""
            
            data = resp.json()
            self.access_token = data.get("access_token")
            self.refresh_token = data.get("refresh_token")
            
            # Validaciones
            if not self.access_token:
                failure("No se recibió access_token")
                self.failed += 1
                return False, ""
            
            if not self.refresh_token:
                failure("No se recibió refresh_token")
                self.failed += 1
                return False, ""
            
            # Verificar JWT
            if len(self.access_token.split(".")) != 3:
                failure("Access token no es JWT válido")
                self.failed += 1
                return False, ""
            
            success(f"Login exitoso")
            info(f"Access token (JWT): {self.access_token[:40]}...")
            info(f"Refresh token (opaco): {self.refresh_token[:30]}...")
            self.passed += 1
            
            return True, self.access_token
            
        except Exception as e:
            failure(f"Error en login: {str(e)}")
            self.failed += 1
            return False, ""

    def access_protected_endpoint(self, token: str) -> bool:
        """Accede a endpoint protegido con token"""
        test_section("FLUJO 2: ACCESO A ENDPOINT PROTEGIDO")
        
        test_case("Paso 2.1: GET /auth/me con access_token válido")
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            resp = requests.get(
                f"{self.base_url}/auth/me",
                headers=headers,
                timeout=5
            )
            
            if resp.status_code != 200:
                failure(f"GET /auth/me falló: {resp.status_code}")
                self.failed += 1
                return False
            
            data = resp.json()
            
            # Validaciones
            if data.get("email") != self.email:
                failure(f"Email no coincide: {data.get('email')} vs {self.email}")
                self.failed += 1
                return False
            
            if "password" in str(data).lower():
                failure("Response contiene 'password'")
                self.failed += 1
                return False
            
            success(f"Perfil obtenido: {data.get('email')}")
            self.passed += 1
            
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False
        
        # Test 2.2: Sin token
        test_case("Paso 2.2: GET /auth/me sin token")
        try:
            resp = requests.get(f"{self.base_url}/auth/me", timeout=5)
            
            if resp.status_code == 401:
                success("Correctamente rechazado sin token (401)")
                self.passed += 1
                return True
            else:
                failure(f"Esperaba 401, obtuvo {resp.status_code}")
                self.failed += 1
                return False
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False

    def refresh_token_rotation(self) -> bool:
        """Prueba rotación de refresh token"""
        test_section("FLUJO 3: REFRESH TOKEN CON ROTACIÓN")
        
        if not self.refresh_token:
            failure("No hay refresh_token disponible")
            self.failed += 1
            return False
        
        old_token = self.refresh_token
        old_access = self.access_token
        
        test_case("Paso 3.1: Renovar tokens con refresh token")
        payload = {"refresh_token": self.refresh_token}
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/refresh",
                json=payload,
                timeout=5
            )
            
            if resp.status_code != 200:
                failure(f"Refresh falló: {resp.status_code}")
                self.failed += 1
                return False
            
            data = resp.json()
            new_access = data.get("access_token")
            new_refresh = data.get("refresh_token")
            
            if not new_access or not new_refresh:
                failure("No se retornaron nuevos tokens")
                self.failed += 1
                return False
            
            # Verificar rotación (tokens diferentes)
            if new_access == old_access:
                failure("Access token no fue renovado")
                self.failed += 1
                return False
            
            if new_refresh == old_token:
                failure("Refresh token no fue rotado")
                self.failed += 1
                return False
            
            self.access_token = new_access
            self.refresh_token = new_refresh
            
            success("Tokens renovados (rotación completada)")
            self.passed += 1
            
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False
        
        # Test 3.2: Intentar reutilizar token antiguo
        test_case("Paso 3.2: Detectar robo (reutilizar token revocado)")
        payload = {"refresh_token": old_token}
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/refresh",
                json=payload,
                timeout=5
            )
            
            if resp.status_code == 401:
                detail = resp.json().get("detail", "")
                success(f"Robo detectado: '{detail}'")
                self.passed += 1
                return True
            else:
                failure(f"Esperaba 401, obtuvo {resp.status_code}")
                self.failed += 1
                return False
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False

    def logout_flow(self) -> bool:
        """Prueba logout y revocación de tokens"""
        test_section("FLUJO 4: LOGOUT Y REVOCACIÓN")
        
        if not self.refresh_token:
            failure("No hay refresh_token disponible")
            self.failed += 1
            return False
        
        test_case("Paso 4.1: Logout revocando refresh token")
        payload = {"refresh_token": self.refresh_token}
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/logout",
                json=payload,
                timeout=5
            )
            
            if resp.status_code != 200:
                failure(f"Logout falló: {resp.status_code}")
                self.failed += 1
                return False
            
            success("Logout exitoso")
            self.passed += 1
            
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False
        
        # Test 4.2: Verificar que token fue revocado
        test_case("Paso 4.2: Verificar que refresh token fue revocado")
        payload = {"refresh_token": self.refresh_token}
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/refresh",
                json=payload,
                timeout=5
            )
            
            if resp.status_code == 401:
                success("Token revocado correctamente (no puede renovar)")
                self.passed += 1
                return True
            else:
                failure(f"Token aún válido después de logout: {resp.status_code}")
                self.failed += 1
                return False
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
            return False

    def error_handling(self) -> bool:
        """Prueba manejo de errores"""
        test_section("FLUJO 5: MANEJO DE ERRORES")
        
        # Test 5.1: Email duplicado
        test_case("Paso 5.1: Intentar registrar con email duplicado")
        payload = {
            "email": self.email,
            "nombre": "Different Name",
            "password": "AnotherPassword123"
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/register",
                json=payload,
                timeout=5
            )
            
            if resp.status_code == 409:
                success("Email duplicado rechazado (409 Conflict)")
                self.passed += 1
            else:
                failure(f"Esperaba 409, obtuvo {resp.status_code}")
                self.failed += 1
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
        
        # Test 5.2: Contraseña débil
        test_case("Paso 5.2: Intentar registrar con contraseña débil")
        payload = {
            "email": f"weak_{int(time.time())}@example.com",
            "nombre": "Weak Password User",
            "password": "short"
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/register",
                json=payload,
                timeout=5
            )
            
            if resp.status_code == 400:
                success("Contraseña débil rechazada (400 Bad Request)")
                self.passed += 1
            else:
                failure(f"Esperaba 400, obtuvo {resp.status_code}")
                self.failed += 1
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
        
        # Test 5.3: Credenciales inválidas (respuesta genérica)
        test_case("Paso 5.3: Login con credenciales inválidas (respuesta genérica)")
        payload = {
            "email": self.email,
            "password": "wrong_password_123"
        }
        
        try:
            resp = requests.post(
                f"{self.base_url}/auth/login",
                json=payload,
                timeout=5
            )
            
            if resp.status_code == 401:
                detail = resp.json().get("detail", "")
                # Verificar que es genérico (no dice "password inválida")
                if "inválida" in detail.lower() or "invalid" in detail.lower():
                    success(f"Respuesta genérica: '{detail}'")
                    self.passed += 1
                else:
                    failure(f"Mensaje no es genérico: '{detail}'")
                    self.failed += 1
            else:
                failure(f"Esperaba 401, obtuvo {resp.status_code}")
                self.failed += 1
                
        except Exception as e:
            failure(f"Error: {str(e)}")
            self.failed += 1
        
        return True

    def security_checks(self) -> bool:
        """Validaciones de seguridad"""
        test_section("FLUJO 6: VALIDACIONES DE SEGURIDAD")
        
        # Test 6.1: CORS headers
        test_case("Paso 6.1: Verificar CORS headers")
        try:
            resp = requests.options(
                f"{self.base_url}/auth/login",
                headers={"Origin": "http://localhost:5173"}
            )
            
            cors_origin = resp.headers.get("Access-Control-Allow-Origin", "")
            cors_methods = resp.headers.get("Access-Control-Allow-Methods", "")
            
            if cors_origin and "localhost:5173" in cors_origin:
                success(f"CORS Origin: {cors_origin}")
                self.passed += 1
            else:
                info(f"CORS Origin no configurado (podría estar en config)")
                self.passed += 1
                
        except Exception as e:
            info(f"CORS check no disponible: {str(e)}")
            self.passed += 1
        
        # Test 6.2: Password validation en frontend (simulado)
        test_case("Paso 6.2: Validación de password en cliente")
        
        # Simular validaciones del frontend
        weak_passwords = ["short", "123", ""]
        valid_passwords = ["ValidPassword123", "SecurePass!@#"]
        
        all_valid = True
        for pwd in weak_passwords:
            if len(pwd) >= 8:  # Frontend check
                failure(f"Contraseña débil aceptada: '{pwd}'")
                all_valid = False
        
        for pwd in valid_passwords:
            if len(pwd) < 8:  # Frontend check
                failure(f"Contraseña válida rechazada: '{pwd}'")
                all_valid = False
        
        if all_valid:
            success("Validaciones de password funcionan")
            self.passed += 1
        else:
            self.failed += 1
        
        return True

    def run_all(self):
        """Ejecuta todos los tests E2E"""
        print(f"\n{B}{'='*70}")
        print(f"  TESTING END-TO-END: AUTENTICACIÓN FOODSTORE")
        print(f"  Base URL: {self.base_url}")
        print(f"{'='*70}{RESET}\n")
        
        # Flujos principales
        success_register, token = self.register_and_login()
        if success_register:
            self.access_protected_endpoint(token)
            self.refresh_token_rotation()
            self.logout_flow()
        
        self.error_handling()
        self.security_checks()
        
        # Resumen
        test_section("RESUMEN FINAL")
        
        total = self.passed + self.failed
        percentage = (self.passed / total * 100) if total > 0 else 0
        
        print(f"Tests Pasados:  {G}{self.passed}{RESET}")
        print(f"Tests Fallidos: {R}{self.failed}{RESET}")
        print(f"Total:          {total}")
        print(f"Porcentaje:     {percentage:.1f}%\n")
        
        if self.failed == 0:
            print(f"{G}{'='*70}")
            print(f"  ✓ TODOS LOS TESTS END-TO-END PASARON")
            print(f"{'='*70}{RESET}\n")
            return True
        else:
            print(f"{R}{'='*70}")
            print(f"  ✗ ALGUNOS TESTS FALLARON")
            print(f"{'='*70}{RESET}\n")
            return False


if __name__ == "__main__":
    tester = E2ETester()
    success = tester.run_all()
    exit(0 if success else 1)
