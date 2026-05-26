import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getAdminOrderDetail, updateOrderStatus } from '../../api/admin';
import { Button } from '../../components/ui/Button';
import { useOrderWebSocket } from '../../hooks/useOrderWebSocket';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// Mapa de acciones FSM disponibles para Admin
const ACTIONS_FOR_STATE: Record<string, { action: string; label: string }[]> = {
  pendiente: [
    { action: 'pagar', label: '✅ Confirmar pago' },
    { action: 'cancelar', label: '❌ Cancelar pedido' },
  ],
  pagado: [
    { action: 'preparar', label: '👨‍🍳 Iniciar preparación' },
    { action: 'cancelar', label: '❌ Cancelar (reembolsar)' },
  ],
  preparando: [
    { action: 'enviar', label: '🚚 Enviar pedido' },
    { action: 'cancelar', label: '❌ Cancelar' },
  ],
  enviado: [
    { action: 'entregar', label: '📦 Marcar entregado' },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  pagado: '#3b82f6',
  preparando: '#8b5cf6',
  enviado: '#06b6d4',
  entregado: '#10b981',
  cancelado: '#ef4444',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const orderId = Number(id);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: () => getAdminOrderDetail(orderId),
    enabled: !!orderId,
    refetchInterval: 30000, // Polling de fallback si WS no funciona
  });

  // WebSocket para tiempo real
  const { connectionStatus, lastEvent } = useOrderWebSocket(orderId);

  // Cuando llega un evento WS, invalidar queries admin para refrescar
  const prevEventId = useRef<string | null>(null);
  const eventKey = lastEvent ? `${lastEvent.pedido_id}-${lastEvent.timestamp}` : null;
  if (eventKey && eventKey !== prevEventId.current) {
    prevEventId.current = eventKey;
    // Invalidar queries para que React Query refresque los datos
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    }, 0);
  }

  const statusMutation = useMutation({
    mutationFn: (accion: string) => updateOrderStatus(orderId, { accion }),
    onSuccess: () => {
      toast.success('Estado del pedido actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setShowConfirm(false);
      setSelectedAction('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar estado');
      setShowConfirm(false);
    },
  });

  if (isLoading) return <div className="text-gray-500">Cargando detalle del pedido...</div>;
  if (error) return <div className="text-red-500">Error al cargar el pedido</div>;
  if (!order) return <div className="text-red-500">Pedido no encontrado</div>;

  const availableActions = ACTIONS_FOR_STATE[order.estado] || [];
  const isTerminal = order.estado === 'entregado' || order.estado === 'cancelado';
  const dir = (order.direccion_snapshot || {}) as Record<string, string | null>;
  const statusColor = STATUS_COLORS[order.estado] || '#6b7280';

  return (
    <div>
      <Button
        variant="secondary" size="sm"
        onClick={() => navigate('/admin/orders')}
        className="mb-4"
      >
        ← Volver a Pedidos
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="m-0 text-gray-900 text-xl font-bold">
            Pedido #{order.id}
          </h2>
          {/* Badge de conexión WS */}
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              backgroundColor: connectionStatus === 'connected' ? '#d1fae5' : '#fef3c7',
              color: connectionStatus === 'connected' ? '#065f46' : '#92400e',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
              }}
            />
            {connectionStatus === 'connected' ? 'En vivo' : connectionStatus === 'fallback' ? 'Polling' : 'Conectando...'}
          </span>
        </div>
        <span
          className="inline-block px-3.5 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {order.estado.toUpperCase()}
        </span>
      </div>

      {/* FSM Actions */}
      {!isTerminal && availableActions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="m-0 mb-2 text-sm text-gray-700">Acciones disponibles:</h4>
          <div className="flex gap-2 flex-wrap">
            {availableActions.map((act) => (
              <Button
                key={act.action}
                variant="secondary" size="sm"
                onClick={() => {
                  setSelectedAction(act.action);
                  setShowConfirm(true);
                }}
              >
                {act.label}
              </Button>
            ))}
          </div>

          {showConfirm && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <p className="m-0 mb-3 text-sm">
                ¿Estás seguro de aplicar "{availableActions.find(a => a.action === selectedAction)?.label}" al pedido #{order.id}?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary" size="md"
                  onClick={() => { setShowConfirm(false); setSelectedAction(''); }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => statusMutation.mutate(selectedAction)}
                  disabled={statusMutation.isPending}
                  loading={statusMutation.isPending}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cliente + Dirección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="m-0 mb-2 text-sm text-gray-700">Cliente</h4>
          <p className="my-1 text-sm">{order.cliente_nombre}</p>
          <p className="my-1 text-sm text-gray-500">{order.cliente_email}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="m-0 mb-2 text-sm text-gray-700">Dirección de entrega</h4>
          <p className="my-1 text-sm">
            {dir.calle || ''} {dir.numero || ''}
          </p>
          <p className="my-1 text-sm text-gray-500">
            {dir.ciudad || ''}, {dir.provincia || ''} {dir.codigo_postal || ''}
          </p>
        </div>
      </div>

      {/* Payment info */}
      {order.pago && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="m-0 mb-2 text-sm text-gray-700">Pago</h4>
          <p className="my-1 text-sm">
            Estado MP: <strong>{order.pago.mp_status}</strong>
            {order.pago.status_detail && <span className="text-gray-500"> ({order.pago.status_detail})</span>}
          </p>
          {order.pago.mp_payment_id && (
            <p className="my-1 text-sm text-gray-500">
              ID de pago MP: {order.pago.mp_payment_id}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="m-0 mb-3 text-sm text-gray-700">
          Items ({order.items.length})
        </h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
              <th className="p-2">Producto</th>
              <th className="p-2">Precio Unit.</th>
              <th className="p-2">Cant.</th>
              <th className="p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-2">{item.producto_nombre}</td>
                <td className="p-2">{formatCurrency(item.precio_unitario)}</td>
                <td className="p-2">{item.cantidad}</td>
                <td className="p-2">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={3} className="p-2 text-right">Total:</td>
              <td className="p-2">{formatCurrency(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="m-0 mb-3 text-sm text-gray-700">Historial de cambios</h4>
        <div className="relative pl-6">
          {order.historial.map((h, idx) => (
            <div key={h.id} className="relative pb-4">
              {/* Timeline dot */}
              <div
                className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{
                  background: STATUS_COLORS[h.estado] || '#6b7280',
                  boxShadow: '0 0 0 1px #e5e7eb',
                }}
              />
              {/* Line (except last) */}
              {idx < order.historial.length - 1 && (
                <div className="absolute -left-[17px] top-[14px] w-[2px] bg-gray-200" style={{ height: 'calc(100% - 4px)' }} />
              )}
              <div className="text-sm">
                <span style={{ fontWeight: 600, color: STATUS_COLORS[h.estado] || '#374151' }}>
                  {h.estado.toUpperCase()}
                </span>
                <span className="text-gray-500 ml-2">
                  {new Date(h.timestamp).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {h.descripcion}
                {h.usuario_id && <span> (por usuario #{h.usuario_id})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
