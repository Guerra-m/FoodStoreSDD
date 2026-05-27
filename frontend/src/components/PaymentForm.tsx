import { useState } from 'react';
import { CardPayment } from '@mercadopago/sdk-react';
import { usePaymentStore } from '../stores/paymentStore';

interface PaymentFormProps {
  totalInCents: number;
  onPayment: (token: string) => Promise<void>;
}

export default function PaymentForm({ totalInCents, onPayment }: PaymentFormProps) {
  const status = usePaymentStore((state) => state.status);
  const error = usePaymentStore((state) => state.error);

  const [brickError, setBrickError] = useState<string | null>(null);

  /* ── Estados terminales ─────────────────────────────────────────── */

  if (status === 'approved') {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Pago aprobado</h3>
        <p className="text-neutral-500 text-sm">Tu pago fue procesado correctamente.</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Pago rechazado</h3>
        <p className="text-neutral-500 text-sm">
          El pago no pudo procesarse. Intentá con otro medio de pago.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Error de pago</h3>
        <p className="text-neutral-500 text-sm">
          {error || 'Ocurrió un error al procesar el pago.'}
        </p>
      </div>
    );
  }

  /* ── Formulario de pago ─────────────────────────────────────────── */

  const amount = totalInCents / 100;

  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey || publicKey === '' || publicKey === 'TEST-1234567890') {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800 mb-1">Configuración de pago necesaria</h4>
            <p className="text-sm text-neutral-600 mb-2">
              Para procesar pagos, necesitás configurar una clave pública válida de MercadoPago en el archivo{' '}
              <code className="text-xs bg-neutral-200 px-1 rounded">.env</code>.
            </p>
            <p className="text-xs text-neutral-500">
              Variable: <code className="bg-neutral-200 px-1 rounded">VITE_MERCADOPAGO_PUBLIC_KEY</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-payment-container">
      <p className="text-neutral-600 text-sm mb-4 font-medium">
        Total a pagar: <strong className="text-neutral-900 text-lg">${amount.toFixed(2)}</strong>
      </p>

      {brickError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          <p className="font-medium mb-1">Error al cargar el formulario</p>
          <p className="text-red-600">{brickError}</p>
        </div>
      )}

      <CardPayment
        initialization={{ amount }}
        onSubmit={async (param) => {
          setBrickError(null);
          try {
            await onPayment(param.token);
          } catch (err) {
            console.error('Payment submit error:', err);
          }
        }}
        locale="es-AR"
        customization={{
          visual: {
            hideFormTitle: true,
            style: {
              customVariables: {
                textPrimaryColor: '#171717',
                textSecondaryColor: '#737373',
                baseColor: '#2563eb',
                errorColor: '#dc2626',
                successColor: '#059669',
              },
            },
          },
        }}
        onError={(mpError) => {
          console.error('MercadoPago CardPayment error:', mpError);
          setBrickError(mpError?.message || 'Error al cargar el formulario de pago');
        }}
      />

      {status === 'processing' && (
        <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-primary-50 rounded-xl">
          <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-primary-700 font-medium">Procesando pago...</span>
        </div>
      )}
    </div>
  );
}