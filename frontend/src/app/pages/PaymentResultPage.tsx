import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentStore } from '../../shared/stores/paymentStore';
import { PaymentResultScreen } from '../../shared/components/PaymentResultScreen';
import { pagoApi } from '../../shared/api/pagoApi';

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
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px' }}>
      <PaymentResultScreen
        orderId={orderId}
        onRetry={handleRetry}
        onViewOrders={handleViewOrders}
        onBackToCatalog={handleBackToCatalog}
      />

      {/* Si no hay status (acceso directo sin params), mostrar instructivo */}
      {!status && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2>Resultado del pago</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            No se recibió información de pago. Si realizaste un pago, revisá tus pedidos para ver el estado.
          </p>
          <Link
            to="/mis-pedidos"
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'inline-block',
            }}
          >
            Ver mis pedidos
          </Link>
        </div>
      )}
    </div>
  );
}
