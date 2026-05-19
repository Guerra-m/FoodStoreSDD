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
      <div className="text-center py-6 px-4">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-green-800 text-lg font-semibold mb-1">Pago aprobado</h3>
        <p className="text-gray-500 text-sm m-0">Tu pago fue procesado correctamente.</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-5xl mb-3">❌</div>
        <h3 className="text-red-800 text-lg font-semibold mb-1">Pago rechazado</h3>
        <p className="text-gray-500 text-sm m-0">
          El pago no pudo procesarse. Intentá con otro medio de pago.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-5xl mb-3">⚠️</div>
        <h3 className="text-yellow-800 text-lg font-semibold mb-1">Error de pago</h3>
        <p className="text-gray-500 text-sm m-0">
          {error || 'Ocurrió un error al procesar el pago.'}
        </p>
      </div>
    );
  }

  /* ── Formulario de pago ─────────────────────────────────────────── */

  const amount = totalInCents / 100;

  return (
    <div className="py-2">
      <p className="text-gray-500 text-sm mb-1 font-medium">
        Total a pagar: <strong className="text-gray-900">${amount.toFixed(2)}</strong>
      </p>

      {brickError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-700">
          Error al cargar el formulario de pago. Verificá que la clave pública de MercadoPago esté configurada correctamente.
          <pre className="mt-1 text-xs text-red-500 whitespace-pre-wrap">{brickError}</pre>
        </div>
      )}

      <div className="min-h-[300px]">
        <CardPayment
          initialization={{ amount }}
          onSubmit={async (param) => {
            setBrickError(null);
            await onPayment(param.token);
          }}
          locale="es-AR"
          onError={(mpError) => {
            console.error('MercadoPago CardPayment error:', mpError);
            setBrickError(mpError?.message || 'Error desconocido al cargar el brick');
          }}
          onReady={() => setBrickError(null)}
        />
      </div>

      {status === 'processing' && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Procesando pago...
        </div>
      )}
    </div>
  );
}
