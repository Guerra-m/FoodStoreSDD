/**
 * Testing script for frontend authentication flows
 * Run with: npm test (or manually check console outputs)
 */

import { getTokens, clearTokens, saveTokens, isTokenExpired, getAccessToken, getRefreshToken, validateEmail, validatePassword } from '../../../utils/auth';

console.log("=== FRONTEND AUTHENTICATION TESTS ===\n");

// Test 1: Token management
console.log("Test 1: Token Management");
try {
  // Clear any existing tokens
  clearTokens();
  const { accessToken: empty1, refreshToken: empty2 } = getTokens();
  
  if (!empty1 && !empty2) {
    console.log("✓ clearTokens() funciona correctamente");
  } else {
    console.log("✗ clearTokens() no funcionó");
  }
  
  // Save tokens
  const testAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjogMjUyNDYwODAwMH0.test";
  const testRefreshToken = "refresh_token_test_12345";
  
  saveTokens(testAccessToken, testRefreshToken);
  const { accessToken, refreshToken } = getTokens();
  
  if (accessToken === testAccessToken && refreshToken === testRefreshToken) {
    console.log("✓ saveTokens() y getTokens() funcionan correctamente");
  } else {
    console.log("✗ Token saving/retrieval falló");
  }
  
  // Test individual getters
  if (getAccessToken() === testAccessToken && getRefreshToken() === testRefreshToken) {
    console.log("✓ getAccessToken() y getRefreshToken() funcionan correctamente");
  } else {
    console.log("✗ Individual token getters fallaron");
  }
} catch (e) {
  console.log("✗ Token management test error:", e);
}

// Test 2: Email validation
console.log("\nTest 2: Email Validation");
try {
  const validEmails = [
    "user@example.com",
    "test.user@example.co.uk",
    "user+tag@example.com"
  ];
  
  const invalidEmails = [
    "not_an_email",
    "user@",
    "@example.com",
    "user @example.com"
  ];
  
  let allValid = true;
  validEmails.forEach(email => {
    if (!validateEmail(email)) {
      console.log(`✗ Email válido rechazado: ${email}`);
      allValid = false;
    }
  });
  
  invalidEmails.forEach(email => {
    if (validateEmail(email)) {
      console.log(`✗ Email inválido aceptado: ${email}`);
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log("✓ Email validation funciona correctamente");
  }
} catch (e) {
  console.log("✗ Email validation test error:", e);
}

// Test 3: Password validation
console.log("\nTest 3: Password Validation");
try {
  const strongPasswords = [
    "password123",
    "SecurePassword!@#",
    "verylongpasswordwithmanycharacters"
  ];
  
  const weakPasswords = [
    "short",
    "123",
    "pwd",
    ""
  ];
  
  let allValid = true;
  strongPasswords.forEach(pwd => {
    const { isValid } = validatePassword(pwd);
    if (!isValid) {
      console.log(`✗ Contraseña fuerte rechazada: ${pwd}`);
      allValid = false;
    }
  });
  
  weakPasswords.forEach(pwd => {
    const { isValid } = validatePassword(pwd);
    if (isValid) {
      console.log(`✗ Contraseña débil aceptada: ${pwd}`);
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log("✓ Password validation funciona correctamente");
  }
} catch (e) {
  console.log("✗ Password validation test error:", e);
}

// Test 4: Token expiration check
console.log("\nTest 4: Token Expiration Check");
try {
  // Create a token that expires in 2 minutes (timestamp in future)
  const futureExp = Math.floor(Date.now() / 1000) + 120;
  const futureToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp }))}.test`;
  
  if (!isTokenExpired(futureToken)) {
    console.log("✓ isTokenExpired() correctamente identifica token válido");
  } else {
    console.log("✗ Token válido fue considerado expirado");
  }
  
  // Create a token that expired hace 1 hora
  const pastExp = Math.floor(Date.now() / 1000) - 3600;
  const pastToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp }))}.test`;
  
  if (isTokenExpired(pastToken)) {
    console.log("✓ isTokenExpired() correctamente identifica token expirado");
  } else {
    console.log("✗ Token expirado no fue detectado");
  }
  
  // Invalid token
  if (isTokenExpired("invalid_token")) {
    console.log("✓ isTokenExpired() correctamente rechaza token inválido");
  } else {
    console.log("✗ Token inválido fue aceptado");
  }
} catch (e) {
  console.log("✗ Token expiration test error:", e);
}

// Test 5: Session storage security (no localStorage)
console.log("\nTest 5: Session Storage Security");
try {
  // Verify tokens are in sessionStorage, not localStorage
  clearTokens();
  saveTokens("test_access", "test_refresh");
  
  const inSessionStorage = sessionStorage.getItem("auth_access_token") === "test_access";
  const notInLocalStorage = localStorage.getItem("auth_access_token") === null;
  
  if (inSessionStorage && notInLocalStorage) {
    console.log("✓ Tokens guardados en sessionStorage (no localStorage)");
  } else {
    console.log("✗ Tokens no están correctamente almacenados");
  }
  
  // Verify tokens are cleared on logout
  clearTokens();
  const clearedSession = sessionStorage.getItem("auth_access_token") === null;
  
  if (clearedSession) {
    console.log("✓ Tokens correctamente limpiados al logout");
  } else {
    console.log("✗ Tokens no fueron limpios");
  }
} catch (e) {
  console.log("✗ Session storage test error:", e);
}

console.log("\n=== FRONTEND TESTS COMPLETE ===\n");
