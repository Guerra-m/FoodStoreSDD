// SUGGESTION: Este componente requiere instalar @mercadopago/sdk-react.
// Ejecutar: pnpm add @mercadopago/sdk-react
// Luego descomentar los imports de MercadoPago y el uso de <CardPayment />.

import { usePaymentStore } from '../stores/paymentStore';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  /** Monto total en centavos (se muestra al usuario como decimal) */
  totalInCents: number;
  /**
   * Callback ejecutado cuando MercadoPago devuelve el token de la tarjeta.
   * Recibe el token string que debe enviarse a POST /api/v1/pagos/crear.
   */
  onPayment: (token: string) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PaymentForm({ totalInCents, onPayment }: PaymentFormProps) {
  const status = usePaymentStore((state) => state.status);
  const error = usePaymentStore((state) => state.error);

  // SUGGESTION: Una vez instalado el SDK, importar initMercadoPago y CardPayment:
  //
  //   import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
  //
  //   initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);

  if (status === 'approved') {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#155724' }}>Pago aprobado</h3>
        <p style={{ color: '#666', margin: 0 }}>
          Tu pago fue procesado correctamente.
        </p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#721c24' }}>Pago rechazado</h3>
        <p style={{ color: '#666', margin: 0 }}>
          El pago no pudo procesarse. Intentá con otro medio de pago.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>Error de pago</h3>
        <p style={{ color: '#666', margin: 0 }}>{error || 'Ocurrió un error al procesar el pago.'}</p>
      </div>
    );
  }

  // SUGGESTION: Reemplazar el div de abajo con <CardPayment /> de MercadoPago:
  //
  // <CardPayment
  //   initialization={{ amount: totalInCents / 100 }}
  //   onSubmit={async (cardFormData) => {
  //     // cardFormData.token contiene el token de la tarjeta
  //     onPayment(cardFormData.token);
  //   }}
  //   onError={(err) => {
  //     console.error('MP CardPayment error:', err);
  //     usePaymentStore.getState().setError('Error al cargar el formulario de pago');
  //   }}
  // />

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>Datos de pago</h3>
      <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
        Total a pagar: <strong>${(totalInCents / 100).toFixed(2)}</strong>
      </p>

      {/* SUGGESTION: <CardPayment /> se renderiza aquí automáticamente */}
      <div
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999',
        }}
      >
        <p style={{ margin: 0 }}>
          Formulario de pago seguro de MercadoPago
        </p>
        <p style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
          (Requiere instalar @mercadopago/sdk-react)
        </p>
      </div>

      {status === 'processing' && (
        <div style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
          Procesando pago...
        </div>
      )}
    </div>
  );
}
