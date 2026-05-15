import { usePaymentStore } from '../stores/paymentStore';

interface PaymentResultScreenProps {
  orderId: number | null;
  onRetry: () => void;
  onViewOrders: () => void;
  onBackToCatalog: () => void;
}

export function PaymentResultScreen({
  orderId,
  onRetry,
  onViewOrders,
  onBackToCatalog,
}: PaymentResultScreenProps) {
  const status = usePaymentStore((state) => state.status);
  const mpPaymentId = usePaymentStore((state) => state.mpPaymentId);
  const statusDetail = usePaymentStore((state) => state.statusDetail);
  const error = usePaymentStore((state) => state.error);

  if (status === 'approved') {
    return (
      <div className="text-center py-8 px-5">
        <div className="text-6xl mb-4 leading-none">✅</div>
        <h2 className="m-0 mb-2 text-green-800">¡Pago aprobado!</h2>
        <p className="text-green-700 m-0 mb-1 text-[15px]">
          Tu pago fue procesado correctamente.
        </p>
        {mpPaymentId && (
          <p className="text-gray-500 text-sm mt-1 mb-5">
            ID de pago: {mpPaymentId}
          </p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onViewOrders} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm border-0 cursor-pointer">
            Ver mi pedido
          </button>
          <button onClick={onBackToCatalog} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm border border-gray-300 cursor-pointer">
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="text-center py-8 px-5">
        <div className="text-6xl mb-4 leading-none">❌</div>
        <h2 className="m-0 mb-2 text-red-800">Pago rechazado</h2>
        <p className="text-red-700 m-0 mb-1 text-[15px]">
          El pago no pudo procesarse. Intentá con otro medio de pago.
        </p>
        {statusDetail && (
          <p className="text-gray-500 text-sm mt-1 mb-5">
            Detalle: {statusDetail}
          </p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onRetry} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm border-0 cursor-pointer">
            Intentar de nuevo
          </button>
          <button onClick={onBackToCatalog} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm border border-gray-300 cursor-pointer">
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8 px-5">
        <div className="text-6xl mb-4 leading-none">⚠️</div>
        <h2 className="m-0 mb-2 text-yellow-800">Error de pago</h2>
        <p className="text-yellow-700 m-0 mb-1 text-[15px]">
          {error || 'Ocurrió un error al procesar el pago.'}
        </p>
        <p className="text-gray-500 text-sm mt-1 mb-5">
          Si el problema persiste, contactate con soporte.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onRetry} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm border-0 cursor-pointer">
            Intentar de nuevo
          </button>
          <button onClick={onBackToCatalog} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm border border-gray-300 cursor-pointer">
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="text-center py-8 px-5">
        <div className="text-6xl mb-4 leading-none">⏳</div>
        <h2 className="m-0 mb-2 text-blue-800">Pago pendiente</h2>
        <p className="text-blue-700 m-0 mb-5 text-[15px]">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onViewOrders} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm border-0 cursor-pointer">
            Ver mis pedidos
          </button>
        </div>
      </div>
    );
  }

  return null;
}
