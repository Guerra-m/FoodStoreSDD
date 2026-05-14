/**
 * Tests unitarios para paymentStore (Zustand).
 * Verifica transiciones de estado, campos auxiliares y reset.
 *
 * Ejecutar con: npx tsx src/shared/stores/tests/paymentStore.test.ts
 */

import { usePaymentStore } from '../paymentStore';

console.log('=== PAYMENT STORE TESTS ===\n');

// ─── Reseteamos el store antes de empezar ─────────────────────────────────────
usePaymentStore.getState().reset();
let pass = 0;
let fail = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.log(`  ✗ ${label}`);
    fail++;
  }
}

// ─── Test 1: Estado inicial ───────────────────────────────────────────────────
console.log('Test 1: Estado inicial');
{
  const state = usePaymentStore.getState();
  assert(state.status === 'idle', 'status es "idle"');
  assert(state.mpPaymentId === null, 'mpPaymentId es null');
  assert(state.statusDetail === null, 'statusDetail es null');
  assert(state.error === null, 'error es null');
}

// ─── Test 2: Transición idle → processing ─────────────────────────────────────
console.log('\nTest 2: setProcessing');
{
  usePaymentStore.getState().setProcessing();
  const state = usePaymentStore.getState();
  assert(state.status === 'processing', 'status es "processing"');
  assert(state.mpPaymentId === null, 'mpPaymentId se resetea a null');
  assert(state.statusDetail === null, 'statusDetail se resetea a null');
  assert(state.error === null, 'error se resetea a null');
}

// ─── Test 3: Transición processing → approved ─────────────────────────────────
console.log('\nTest 3: setApproved');
{
  usePaymentStore.getState().setApproved(12345, 'accredited');
  const state = usePaymentStore.getState();
  assert(state.status === 'approved', 'status es "approved"');
  assert(state.mpPaymentId === 12345, 'mpPaymentId es 12345');
  assert(state.statusDetail === 'accredited', 'statusDetail es "accredited"');
  assert(state.error === null, 'error sigue siendo null');
}

// ─── Test 4: Transición processing → rejected ─────────────────────────────────
console.log('\nTest 4: setRejected');
{
  // Reseteamos primero
  usePaymentStore.getState().reset();
  usePaymentStore.getState().setRejected('rejected_by_bank');
  const state = usePaymentStore.getState();
  assert(state.status === 'rejected', 'status es "rejected"');
  assert(state.mpPaymentId === null, 'mpPaymentId es null en rejected');
  assert(state.statusDetail === 'rejected_by_bank', 'statusDetail es "rejected_by_bank"');
  assert(state.error === null, 'error es null');
}

// ─── Test 5: Transición processing → error ────────────────────────────────────
console.log('\nTest 5: setError');
{
  usePaymentStore.getState().reset();
  usePaymentStore.getState().setError('Error de conexión con MercadoPago');
  const state = usePaymentStore.getState();
  assert(state.status === 'error', 'status es "error"');
  assert(state.mpPaymentId === null, 'mpPaymentId es null');
  assert(state.statusDetail === null, 'statusDetail es null');
  assert(state.error === 'Error de conexión con MercadoPago', 'error tiene el mensaje correcto');
}

// ─── Test 6: Reset ────────────────────────────────────────────────────────────
console.log('\nTest 6: reset');
{
  // Llevamos a un estado no-idle
  usePaymentStore.getState().setApproved(999, 'accredited');
  usePaymentStore.getState().reset();

  const state = usePaymentStore.getState();
  assert(state.status === 'idle', 'status vuelve a "idle"');
  assert(state.mpPaymentId === null, 'mpPaymentId vuelve a null');
  assert(state.statusDetail === null, 'statusDetail vuelve a null');
  assert(state.error === null, 'error vuelve a null');
}

// ─── Test 7: Transiciones completas del ciclo de vida ─────────────────────────
console.log('\nTest 7: Ciclo completo idle → processing → approved');
{
  usePaymentStore.getState().reset();
  assert(usePaymentStore.getState().status === 'idle', 'inicia en idle');

  usePaymentStore.getState().setProcessing();
  assert(usePaymentStore.getState().status === 'processing', 'pasa a processing tras enviar pago');

  usePaymentStore.getState().setApproved(42, 'accredited');
  assert(usePaymentStore.getState().status === 'approved', 'finaliza en approved');
  assert(usePaymentStore.getState().mpPaymentId === 42, 'mpPaymentId guardado');
}

console.log('\nTest 8: Ciclo completo idle → processing → rejected');
{
  usePaymentStore.getState().reset();
  usePaymentStore.getState().setProcessing();
  usePaymentStore.getState().setRejected('insufficient_amount');
  const state = usePaymentStore.getState();
  assert(state.status === 'rejected', 'finaliza en rejected');
  assert(state.statusDetail === 'insufficient_amount', 'statusDetail refleja el motivo');
}

console.log('\n---');
console.log(`Resultado: ${pass} pasaron, ${fail} fallaron de ${pass + fail} tests`);
console.log(pass > 0 && fail === 0 ? '✓ TODOS LOS TESTS PASARON' : '✗ HAY TESTS FALLADOS');
console.log('\n=== TESTS COMPLETADOS ===');
