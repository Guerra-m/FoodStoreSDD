import { formatPrice, formatDate, getEstadoLabel, getEstadoColor, getPaymentStatusLabel, getPaymentStatusColor } from '../api/orders';
import type { OrderResponse } from '../api/orders';

interface OrderSummaryCardProps {
  order: OrderResponse;
}

/**
 * Componente reutilizable que muestra un resumen compacto del pedido.
 * Incluye items, total, dirección y badges de estado.
 */
export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const hasRejectedPayment = order.payment_status === 'rejected';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
      {/* Estado del pedido */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Pedido #{order.id}</span>
          <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '10px' }}>
            {formatDate(order.creado_en)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
            fontWeight: 'bold', color: 'white',
            backgroundColor: getEstadoColor(order.estado),
          }}>
            {getEstadoLabel(order.estado)}
          </span>
          {order.payment_status && (
            <span style={{
              padding: '4px 10px', borderRadius: '12px', fontSize: '11px',
              fontWeight: 'bold', color: 'white',
              backgroundColor: getPaymentStatusColor(order.payment_status),
            }}>
              Pago: {getPaymentStatusLabel(order.payment_status)}
            </span>
          )}
        </div>
      </div>

      {/* Payment rejected alert */}
      {hasRejectedPayment && (
        <div style={{
          marginBottom: '20px', padding: '10px', background: '#f8d7da',
          borderRadius: '4px', color: '#721c24', fontSize: '13px',
        }}>
          El pago fue rechazado. Para reintentar, contactate con soporte o realizá un nuevo pedido.
        </div>
      )}

      {/* Dirección de entrega */}
      <div style={{ marginBottom: '20px' }}>
        <strong>Dirección de entrega:</strong>
        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          {order.direccion_snapshot.calle} {order.direccion_snapshot.numero}
          {order.direccion_snapshot.piso && `, Piso ${order.direccion_snapshot.piso}`}
          {order.direccion_snapshot.departamento && `, Depto ${order.direccion_snapshot.departamento}`}
          <br />
          {order.direccion_snapshot.ciudad}, {order.direccion_snapshot.codigo_postal}
        </div>
      </div>

      {/* Items */}
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Items</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Producto</th>
            <th style={{ padding: '8px', textAlign: 'center' }}>Cantidad</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px' }}>
                {item.producto_snapshot.nombre}
                {item.ingredientes_excluidos.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Sin: {item.ingredientes_excluidos.join(', ')}
                  </div>
                )}
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(item.precio_unitario)}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {formatPrice(item.precio_unitario * item.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
              Total:
            </td>
            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>
              {formatPrice(order.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Historial */}
      {order.historial && order.historial.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Historial</h3>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {order.historial.map((h, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <strong>{formatDate(h.timestamp)}</strong>: {h.descripcion}
                {h.usuario_id && ` (Usuario #${h.usuario_id})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
