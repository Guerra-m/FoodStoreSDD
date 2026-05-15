// SUGGESTION: Este componente requiere instalar @mercadopago/sdk-react.
// Ejecutar: pnpm add @mercadopago/sdk-react
// Luego descomentar los imports de MercadoPago y el uso de <CardPayment />.

import { usePaymentStore } from '../stores/paymentStore';

interface PaymentFormProps {
  /** Monto total en centavos */
  totalInCents: number;
  /** Callback con token de MercadoPago */
  onPayment: (token: string) => void;
}

export default function PaymentForm({ totalInCents, onPayment }: PaymentFormProps) {
  const status = usePaymentStore((state) => state.status);
  const error = usePaymentStore((state) => state.error);

  if (status === 'approved') {
    return (
      <div className="text-center p-5">
        <div className="text-5xl mb-2.5">✅</div>
        <h3 className="m-0 mb-2 text-green-800">Pago aprobado</h3>
        <p className="text-gray-500 m-0">Tu pago fue procesado correctamente.</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="text-center p-5">
        <div className="text-5xl mb-2.5">❌</div>
        <h3 className="m-0 mb-2 text-red-800">Pago rechazado</h3>
        <p className="text-gray-500 m-0">El pago no pudo procesarse. Intentá con otro medio de pago.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center p-5">
        <div className="text-5xl mb-2.5">⚠️</div>
        <h3 className="m-0 mb-2 text-yellow-800">Error de pago</h3>
        <p className="text-gray-500 m-0">{error || 'Ocurrió un error al procesar el pago.'}</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h3 className="m-0 mb-4">Datos de pago</h3>
      <p className="text-gray-500 mb-4 text-sm">
        Total a pagar: <strong>${(totalInCents / 100).toFixed(2)}</strong>
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg py-10 px-5 text-center text-gray-400">
        <p className="m-0">Formulario de pago seguro de MercadoPago</p>
        <p className="text-xs mt-2 m-0">(Requiere instalar @mercadopago/sdk-react)</p>
      </div>

      {status === 'processing' && (
        <div className="text-center mt-4 text-gray-500">Procesando pago...</div>
      )}
    </div>
  );
}
