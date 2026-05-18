import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentStore } from '../stores/paymentStore';
import { PaymentResultScreen } from '../components/PaymentResultScreen';
import { pagoApi } from '../api/pagos';

/**
 * Página de resultado de pago.
 * MercadoPago redirige aquí via `back_urls` con query params:
 *   ?status=approved|rejected|pending&payment_id=123&external_reference=order_456
 */
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setApproved = usePaymentStore((state) => state.setApproved);
  const setRejected = usePaymentStore((state) => state.setRejected);
  const resetPayment = usePaymentStore((state) => state.reset);
  const processed = useRef(false);

  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalRef = searchParams.get('external_reference');

  // Extraer orderId de external_reference (formato: "order_456")
  const orderId = externalRef
    ? parseInt(externalRef.replace('order_', ''), 10) || null
    : null;

  // Procesar el resultado una sola vez al montar
  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (status === 'approved' || status === 'rejected') {
      // Si tenemos status desde MP, actualizar el store
      if (status === 'approved') {
        setApproved(paymentId ? Number(paymentId) : 0);
      } else {
        setRejected();
      }
    }
  }, [status, paymentId, setApproved, setRejected]);

  // Polling para pending — delegar al hook usePagoByPedido
  // (se activa desde CartDrawer cuando el pago está pendiente)

  const handleRetry = () => {
    resetPayment();
    navigate(-1); // Volver a la página anterior (checkout)
  };

  const handleViewOrders = () => {
    navigate('/mis-pedidos');
  };

  const handleBackToCatalog = () => {
    navigate('/catalog');
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <PaymentResultScreen
        orderId={orderId}
        onRetry={handleRetry}
        onViewOrders={handleViewOrders}
        onBackToCatalog={handleBackToCatalog}
      />

      {/* Si no hay status (acceso directo sin params), mostrar instructivo */}
      {!status && (
        <div className="text-center px-5 py-10">
          <h2>Resultado del pago</h2>
          <p className="text-gray-500 mb-5">
            No se recibió información de pago. Si realizaste un pago, revisá tus pedidos para ver el estado.
          </p>
          <Link
            to="/mis-pedidos"
            className="px-4 py-2 bg-blue-600 text-white no-underline rounded-md inline-flex items-center justify-center gap-2 font-medium"
          >
            Ver mis pedidos
          </Link>
        </div>
      )}
    </div>
  );
}
