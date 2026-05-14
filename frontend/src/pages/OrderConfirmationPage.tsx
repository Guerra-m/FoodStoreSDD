import { useParams, Link } from 'react-router-dom';
import { useOrderById } from '../hooks/useOrders';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { SkeletonDetail } from '../components/SkeletonDetail';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useOrderById(Number(orderId));

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (error || !order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2>Pedido no encontrado</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          No pudimos encontrar el pedido solicitado.
        </p>
        <Link
          to="/catalog"
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-block',
          }}
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Success header */}
      <div
        style={{
          textAlign: 'center',
          padding: '30px 20px',
          marginBottom: '24px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
        <h1 style={{ margin: '0 0 8px 0', color: '#166534' }}>¡Pedido confirmado!</h1>
        <p style={{ margin: 0, color: '#15803d', fontSize: '16px' }}>
          Tu pedido fue registrado con éxito. Te notificaremos cuando esté en camino.
        </p>
      </div>

      {/* Order details */}
      <OrderSummaryCard order={order} />

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/mis-pedidos"
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/catalog"
          style={{
            padding: '12px 24px',
            background: '#f0f0f0',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
