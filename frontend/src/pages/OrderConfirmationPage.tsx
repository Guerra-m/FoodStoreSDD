import { useParams, Link } from 'react-router-dom';
import { useOrderById } from '../hooks/useOrders';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { Alert } from '../components/ui/Alert';
import { SkeletonDetail } from '../components/SkeletonDetail';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useOrderById(Number(orderId));

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (error || !order) {
    return (
      <div className="p-10 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2>Pedido no encontrado</h2>
        <p className="text-gray-500 mb-5">
          No pudimos encontrar el pedido solicitado.
        </p>
        <Link
          to="/catalog"
          className="px-4 py-2 bg-blue-600 text-white no-underline rounded-md inline-flex items-center justify-center gap-2 font-medium"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      {/* Success header */}
      <div className="mb-6">
        <Alert variant="success" title="¡Pedido confirmado!">
          Tu pedido fue registrado con éxito. Te notificaremos cuando esté en camino.
        </Alert>
      </div>

      {/* Order details */}
      <OrderSummaryCard order={order} />

      {/* Action buttons */}
      <div className="flex gap-3 justify-center mt-6 flex-wrap">
        <Link
          to="/mis-pedidos"
          className="px-6 py-3 bg-blue-600 text-white no-underline rounded-md font-semibold text-[15px] inline-flex items-center justify-center gap-2"
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-3 bg-white text-gray-700 no-underline rounded-md font-semibold text-[15px] border border-gray-300 inline-flex items-center justify-center gap-2"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
