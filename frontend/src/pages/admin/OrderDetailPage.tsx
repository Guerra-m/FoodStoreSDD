import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getAdminOrderDetail, updateOrderStatus } from '../../api/admin';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// Mapa de acciones FSM disponibles para Admin
// Basado en: backend/app/modules/pedidos/fsm.py TRANSITION_MAP para Admin
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
  });

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

  if (isLoading) return <div style={{ color: '#6b7280' }}>Cargando detalle del pedido...</div>;
  if (error) return <div style={{ color: '#ef4444' }}>Error al cargar el pedido</div>;
  if (!order) return <div style={{ color: '#ef4444' }}>Pedido no encontrado</div>;

  const availableActions = ACTIONS_FOR_STATE[order.estado] || [];
  const isTerminal = order.estado === 'entregado' || order.estado === 'cancelado';

  // Datos de dirección
  const dir = order.direccion_snapshot || {};

  return (
    <div>
      <button
        onClick={() => navigate('/admin/orders')}
        style={{
          padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px',
          background: '#fff', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem',
        }}
      >
        ← Volver a Pedidos
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>
          Pedido #{order.id}
        </h2>
        <span
          style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '16px',
            fontSize: '0.85rem', fontWeight: 600,
            background: `${STATUS_COLORS[order.estado] || '#6b7280'}20`,
            color: STATUS_COLORS[order.estado] || '#6b7280',
          }}
        >
          {order.estado.toUpperCase()}
        </span>
      </div>

      {/* FSM Actions */}
      {!isTerminal && availableActions.length > 0 && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#374151' }}>Acciones disponibles:</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availableActions.map((act) => (
              <button
                key={act.action}
                onClick={() => {
                  setSelectedAction(act.action);
                  setShowConfirm(true);
                }}
                style={{
                  padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px',
                  background: '#fff', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Confirmation dialog */}
          {showConfirm && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
                ¿Estás seguro de aplicar "{availableActions.find(a => a.action === selectedAction)?.label}" al pedido #{order.id}?
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedAction('');
                  }}
                  style={{
                    padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px',
                    background: '#fff', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => statusMutation.mutate(selectedAction)}
                  disabled={statusMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem', border: 'none', borderRadius: '6px',
                    background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  {statusMutation.isPending ? 'Aplicando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cliente info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#374151' }}>Cliente</h4>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>{order.cliente_nombre}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6b7280' }}>{order.cliente_email}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#374151' }}>Dirección de entrega</h4>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            {dir.calle || ''} {dir.numero || ''}
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
            {dir.ciudad || ''}, {dir.provincia || ''} {dir.codigo_postal || ''}
          </p>
        </div>
      </div>

      {/* Payment info */}
      {order.pago && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#374151' }}>Pago</h4>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            Estado MP: <strong>{order.pago.mp_status}</strong>
            {order.pago.status_detail && <span style={{ color: '#6b7280' }}> ({order.pago.status_detail})</span>}
          </p>
          {order.pago.mp_payment_id && (
            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
              ID de pago MP: {order.pago.mp_payment_id}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#374151' }}>
          Items ({order.items.length})
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Producto</th>
              <th style={{ padding: '0.5rem' }}>Precio Unit.</th>
              <th style={{ padding: '0.5rem' }}>Cant.</th>
              <th style={{ padding: '0.5rem' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.5rem' }}>{item.producto_nombre}</td>
                <td style={{ padding: '0.5rem' }}>{formatCurrency(item.precio_unitario)}</td>
                <td style={{ padding: '0.5rem' }}>{item.cantidad}</td>
                <td style={{ padding: '0.5rem' }}>{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={3} style={{ padding: '0.5rem', textAlign: 'right' }}>Total:</td>
              <td style={{ padding: '0.5rem' }}>{formatCurrency(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Timeline */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#374151' }}>Historial de cambios</h4>
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {order.historial.map((h, idx) => (
            <div key={h.id} style={{ position: 'relative', paddingBottom: '1rem' }}>
              {/* Timeline dot */}
              <div
                style={{
                  position: 'absolute', left: '-1.5rem', top: '4px',
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: STATUS_COLORS[h.estado] || '#6b7280',
                  border: '2px solid #fff', boxShadow: '0 0 0 1px #e5e7eb',
                }}
              />
              {/* Line (except last) */}
              {idx < order.historial.length - 1 && (
                <div
                  style={{
                    position: 'absolute', left: '-1.1rem', top: '14px',
                    width: '2px', height: 'calc(100% - 4px)',
                    background: '#e5e7eb',
                  }}
                />
              )}
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: STATUS_COLORS[h.estado] || '#374151' }}>
                  {h.estado.toUpperCase()}
                </span>
                <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                  {new Date(h.timestamp).toLocaleString('es-AR')}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
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
