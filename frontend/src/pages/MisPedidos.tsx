import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useOrderById } from '../hooks/useOrders';
import { formatPrice, formatDate, getEstadoLabel, getEstadoColor, getPaymentStatusLabel, getPaymentStatusColor } from '../api/orders';
import { SkeletonTable } from '../components/SkeletonTable';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import PaymentForm from '../components/PaymentForm';
import { usePaymentStore } from '../stores/paymentStore';
import { useCreatePayment, usePagoByPedido } from '../hooks/usePago';

/** Estados terminales que no necesitan tracking en vivo */
const ESTADOS_TERMINALES = ['entregado', 'cancelado'];

export default function MisPedidos() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOrders(page, 10, { refetchInterval: 30000 });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const { data: orderDetail, isLoading: detailLoading } = useOrderById(selectedOrderId);

  // Payment flow state
  const [showPayment, setShowPayment] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const paymentStatus = usePaymentStore((state) => state.status);
  const createPayment = useCreatePayment();
  const { data: pagoData } = usePagoByPedido(selectedOrderId, pollingEnabled);

  const handlePaymentToken = async (token: string) => {
    if (!selectedOrderId) return;
    usePaymentStore.getState().setProcessing();
    try {
      await createPayment.mutateAsync({ card_token: token, pedido_id: selectedOrderId });
      setPollingEnabled(true);
    } catch (err: any) {
      usePaymentStore.getState().setError(
        err.response?.data?.detail || 'Error al procesar el pago',
      );
    }
  };

  const handleCloseModal = () => {
    if (paymentStatus === 'approved') {
      refetch();
    }
    setShowPayment(false);
    setSelectedOrderId(null);
    usePaymentStore.getState().reset();
  };

  const handleStartPayment = () => {
    usePaymentStore.getState().reset();
    setShowPayment(true);
  };

  const handleRetry = () => {
    usePaymentStore.getState().reset();
  };

  // Polling: escucha el estado del pago
  useEffect(() => {
    if (!pagoData || !pollingEnabled) return;
    const { mp_status, mp_payment_id, status_detail } = pagoData;
    if (mp_status === 'approved') {
      usePaymentStore.getState().setApproved(mp_payment_id ?? 0, status_detail ?? undefined);
      setPollingEnabled(false);
    } else if (mp_status === 'rejected') {
      usePaymentStore.getState().setRejected(status_detail ?? undefined);
      setPollingEnabled(false);
    }
  }, [pagoData, pollingEnabled]);

  if (isLoading) {
    return (
      <div className="p-5 max-w-5xl mx-auto">
        <h1>Mis Pedidos</h1>
        <SkeletonTable rows={5} />
      </div>
    );
  }
  if (error) return <div className="p-5 text-red-500">Error al cargar pedidos</div>;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1>Mis Pedidos</h1>
      
      {data?.pedidos && data.pedidos.length === 0 ? (
        <div className="text-center p-10">
          <p className="text-gray-500 mb-5">No tenés pedidos aún.</p>
          <Link 
            to="/catalog" 
            className="px-4 py-2 bg-blue-600 text-white no-underline rounded inline-flex items-center justify-center gap-2 font-medium"
          >
            Ir al Catálogo
          </Link>
        </div>
      ) : (
        <>
          {/* Lista de pedidos */}
          <div className="mb-8">
            {data?.pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="border border-gray-200 rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-3"
              >
                <div>
                  <div className="font-bold text-base">
                    Pedido #{pedido.id}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {formatDate(pedido.creado_en)}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    Entrega: {pedido.direccion_snapshot.calle} {pedido.direccion_snapshot.numero}, {pedido.direccion_snapshot.ciudad}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getEstadoColor(pedido.estado) }}
                  >
                    {getEstadoLabel(pedido.estado)}
                  </span>

                  {pedido.payment_status && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getPaymentStatusColor(pedido.payment_status) }}
                    >
                      Pago: {getPaymentStatusLabel(pedido.payment_status)}
                    </span>
                  )}
                  
                  <span className="text-lg font-bold">
                    {formatPrice(pedido.total)}
                  </span>
                  
                  {!ESTADOS_TERMINALES.includes(pedido.estado) && (
                    <Link
                      to={`/mis-pedidos/${pedido.id}/tracking`}
                      className="px-4 py-2 bg-green-600 text-white no-underline rounded inline-flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      Ver Tracking
                    </Link>
                  )}
                  <Button onClick={() => setSelectedOrderId(pedido.id)}>
                    Ver Detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="px-4 py-2">
              Página {page} ({(data?.total || 0)} pedidos)
            </span>
            <Button
              variant="secondary" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page * 10 >= data.total}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      {/* Modal de detalle del pedido */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white p-5 rounded-lg max-w-[600px] w-[90%] max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-5">
                <SkeletonTable rows={3} columns={[{ width: '40%' }, { width: '20%' }, { width: '20%' }, { width: '20%' }]} />
              </div>
            ) : orderDetail ? (
              <>
                {/* ── Payment View ── */}
                {showPayment ? (
                  <>
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="m-0">Pagar Pedido #{orderDetail.id}</h2>
                      <Button
                        variant="ghost" size="sm"
                        onClick={handleCloseModal}
                        className="text-2xl"
                      >
                        ×
                      </Button>
                    </div>

                    <PaymentForm totalInCents={orderDetail.total} onPayment={handlePaymentToken} />

                    {(paymentStatus === 'rejected' || paymentStatus === 'error') && (
                      <Button onClick={handleRetry} className="mt-4 w-full">
                        Reintentar
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {/* ── Detail View ── */}
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="m-0">Pedido #{orderDetail.id}</h2>
                      <Button
                        variant="ghost" size="sm"
                        onClick={handleCloseModal}
                        className="text-2xl"
                      >
                        ×
                      </Button>
                    </div>

                    <div className="mb-5">
                      <strong>Estado:</strong>{' '}
                      <span
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getEstadoColor(orderDetail.estado) }}
                      >
                        {getEstadoLabel(orderDetail.estado)}
                      </span>

                      {orderDetail.payment_status && (
                        <>
                          {' '}
                          <span
                            className="px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: getPaymentStatusColor(orderDetail.payment_status) }}
                          >
                            Pago: {getPaymentStatusLabel(orderDetail.payment_status)}
                          </span>
                        </>
                      )}
                    </div>

                    {orderDetail.payment_status === 'rejected' && (
                      <Alert variant="error" className="mb-5">
                        El pago fue rechazado. Para reintentar, contactate con soporte o realizá un nuevo pedido.
                      </Alert>
                    )}

                    <div className="mb-5">
                      <strong>Fecha:</strong> {formatDate(orderDetail.creado_en)}
                    </div>

                    <div className="mb-5">
                      <strong>Dirección de entrega:</strong>
                      <div className="text-gray-500">
                        {orderDetail.direccion_snapshot.calle} {orderDetail.direccion_snapshot.numero}
                        {orderDetail.direccion_snapshot.piso && `, Piso ${orderDetail.direccion_snapshot.piso}`}
                        {orderDetail.direccion_snapshot.departamento && `, Depto ${orderDetail.direccion_snapshot.departamento}`}
                        <br />
                        {orderDetail.direccion_snapshot.ciudad}, {orderDetail.direccion_snapshot.codigo_postal}
                      </div>
                    </div>

                    <h3>Items</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left p-2">Producto</th>
                          <th className="text-center p-2">Cantidad</th>
                          <th className="text-right p-2">Precio</th>
                          <th className="text-right p-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetail.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="p-2">
                              {item.producto_snapshot.nombre}
                              {item.ingredientes_excluidos.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Sin: {item.ingredientes_excluidos.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="text-center p-2">{item.cantidad}</td>
                            <td className="text-right p-2">{formatPrice(item.precio_unitario)}</td>
                            <td className="text-right p-2">
                              {formatPrice(item.precio_unitario * item.cantidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right p-2 font-bold">
                            Total:
                          </td>
                          <td className="text-right p-2 font-bold text-lg">
                            {formatPrice(orderDetail.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {orderDetail.historial.length > 0 && (
                      <>
                        <h3 className="mt-5">Historial</h3>
                        <div className="text-sm text-gray-500">
                          {orderDetail.historial.map((h, idx) => (
                            <div key={idx} className="mb-2">
                              <strong>{formatDate(h.timestamp)}</strong>: {h.descripcion} 
                              {h.usuario_id && ` (Usuario #${h.usuario_id})`}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Botón "Pagar ahora" para pedidos pendientes */}
                    {orderDetail.estado === 'pendiente' && !showPayment && (
                      <div className="mt-6">
                        <Button onClick={handleStartPayment} className="w-full">
                          Pagar ahora — {formatPrice(orderDetail.total)}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div>Error al cargar el detalle</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
