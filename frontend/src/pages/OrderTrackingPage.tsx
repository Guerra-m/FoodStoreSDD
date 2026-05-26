import { useParams, Link } from 'react-router-dom';
import { useOrderById } from '../hooks/useOrders';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import { OrderTrackingDashboard } from '../components/OrderTrackingDashboard';
import { formatPrice, formatDate, getEstadoLabel, getEstadoColor, getPaymentStatusLabel, getPaymentStatusColor } from '../api/orders';
import { SkeletonDetail } from '../components/SkeletonDetail';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const pedidoId = Number(id);

  const { data: order, isLoading, error } = useOrderById(pedidoId);
  const {
    connectionStatus,
    lastEvent,
    connectionError,
    reconnect,
  } = useOrderWebSocket(pedidoId);

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (error || !order) {
    return (
      <div className="p-10 text-center">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2>Pedido no encontrado</h2>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>
          No pudimos encontrar el pedido solicitado.
        </p>
        <Link
          to="/mis-pedidos"
          className="px-4 py-2 bg-blue-600 text-white no-underline rounded-md inline-flex items-center justify-center gap-2 font-medium"
        >
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  // Usar el estado más reciente: del WS si llegó algo, o del REST query
  const estadoActual = lastEvent?.estado_nuevo || order.estado;
  const historialMesclado = lastEvent?.historial || order.historial || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: 14, color: '#6b7280' }}>
        <Link to="/mis-pedidos" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          Mis Pedidos
        </Link>
        {' / '}
        <span style={{ color: '#111827', fontWeight: 600 }}>
          Pedido #{order.id}
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
            Pedido #{order.id}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {formatDate(order.creado_en)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: getEstadoColor(estadoActual),
            }}
          >
            {getEstadoLabel(estadoActual)}
          </span>

          {order.payment_status && (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: getPaymentStatusColor(order.payment_status),
              }}
            >
              Pago: {getPaymentStatusLabel(order.payment_status)}
            </span>
          )}
        </div>
      </div>

      {/* Dashboard de tracking */}
      <div style={{ marginBottom: 24 }}>
        <OrderTrackingDashboard
          estadoActual={estadoActual}
          historial={historialMesclado}
          isConnected={connectionStatus === 'connected'}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          pedidoId={order.id}
          onReconnect={reconnect}
        />
      </div>

      {/* Resumen del pedido */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Detalle del Pedido
        </h3>

        {/* Dirección de entrega */}
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 14, color: '#374151' }}>Dirección de entrega:</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            {order.direccion_snapshot.calle} {order.direccion_snapshot.numero}
            {order.direccion_snapshot.piso && `, Piso ${order.direccion_snapshot.piso}`}
            {order.direccion_snapshot.departamento && `, Depto ${order.direccion_snapshot.departamento}`}
            <br />
            {order.direccion_snapshot.ciudad}, {order.direccion_snapshot.codigo_postal}
          </p>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d1d5db' }}>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 13, color: '#374151' }}>Producto</th>
              <th style={{ textAlign: 'center', padding: 8, fontSize: 13, color: '#374151' }}>Cant.</th>
              <th style={{ textAlign: 'right', padding: 8, fontSize: 13, color: '#374151' }}>Precio</th>
              <th style={{ textAlign: 'right', padding: 8, fontSize: 13, color: '#374151' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8, fontSize: 14 }}>
                  {item.producto_snapshot.nombre}
                  {item.ingredientes_excluidos.length > 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      Sin: {item.ingredientes_excluidos.join(', ')}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: 8, fontSize: 14 }}>{item.cantidad}</td>
                <td style={{ textAlign: 'right', padding: 8, fontSize: 14 }}>{formatPrice(item.precio_unitario)}</td>
                <td style={{ textAlign: 'right', padding: 8, fontSize: 14 }}>
                  {formatPrice(item.precio_unitario * item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', padding: 8, fontWeight: 700, fontSize: 14 }}>
                Total:
              </td>
              <td style={{ textAlign: 'right', padding: 8, fontWeight: 700, fontSize: 16 }}>
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          to="/mis-pedidos"
          className="px-6 py-3 bg-white text-gray-700 no-underline rounded-md font-semibold text-[15px] border border-gray-300 inline-flex items-center justify-center gap-2"
        >
          Volver a Mis Pedidos
        </Link>
      </div>
    </div>
  );
}
