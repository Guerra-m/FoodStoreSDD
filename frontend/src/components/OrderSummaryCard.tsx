import { Alert } from './ui/Alert';
import { formatPrice, formatDate, getEstadoLabel, getEstadoColor, getPaymentStatusLabel, getPaymentStatusColor } from '../api/orders';
import type { OrderResponse } from '../api/orders';

interface OrderSummaryCardProps {
  order: OrderResponse;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const hasRejectedPayment = order.payment_status === 'rejected';

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-2 flex-wrap">
        <div>
          <span className="font-bold text-lg">Pedido #{order.id}</span>
          <span className="text-gray-500 text-sm ml-2">
            {formatDate(order.creado_en)}
          </span>
        </div>
        <div className="flex gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: getEstadoColor(order.estado) }}
          >
            {getEstadoLabel(order.estado)}
          </span>
          {order.payment_status && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
            >
              Pago: {getPaymentStatusLabel(order.payment_status)}
            </span>
          )}
        </div>
      </div>

      {/* Rejected alert */}
      {hasRejectedPayment && (
        <Alert variant="error" className="mb-5">
          El pago fue rechazado. Para reintentar, contactate con soporte o realizá un nuevo pedido.
        </Alert>
      )}

      {/* Dirección */}
      <div className="mb-5">
        <strong>Dirección de entrega:</strong>
        <div className="text-gray-500 text-sm mt-1">
          {order.direccion_snapshot.calle} {order.direccion_snapshot.numero}
          {order.direccion_snapshot.piso && `, Piso ${order.direccion_snapshot.piso}`}
          {order.direccion_snapshot.departamento && `, Depto ${order.direccion_snapshot.departamento}`}
          <br />
          {order.direccion_snapshot.ciudad}, {order.direccion_snapshot.codigo_postal}
        </div>
      </div>

      {/* Items table */}
      <h3 className="m-0 mb-3 text-base">Items</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
            <th className="p-2">Producto</th>
            <th className="p-2 text-center">Cantidad</th>
            <th className="p-2 text-right">Precio</th>
            <th className="p-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="p-2">
                {item.producto_snapshot.nombre}
                {item.ingredientes_excluidos.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Sin: {item.ingredientes_excluidos.join(', ')}
                  </div>
                )}
              </td>
              <td className="p-2 text-center">{item.cantidad}</td>
              <td className="p-2 text-right">{formatPrice(item.precio_unitario)}</td>
              <td className="p-2 text-right">
                {formatPrice(item.precio_unitario * item.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="p-2 text-right font-bold">Total:</td>
            <td className="p-2 text-right font-bold text-lg">
              {formatPrice(order.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Historial */}
      {order.historial && order.historial.length > 0 && (
        <div className="mt-5">
          <h3 className="m-0 mb-3 text-base">Historial</h3>
          <div className="text-sm text-gray-500">
            {order.historial.map((h, idx) => (
              <div key={idx} className="mb-1.5">
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
