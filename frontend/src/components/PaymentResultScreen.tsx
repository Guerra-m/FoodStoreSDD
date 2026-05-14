import { usePaymentStore } from '../stores/paymentStore';

interface PaymentResultScreenProps {
  /** ID del pedido asociado */
  orderId: number | null;
  /** Callback para reintentar el pago */
  onRetry: () => void;
  /** Callback para ver los pedidos */
  onViewOrders: () => void;
  /** Callback para volver al catálogo */
  onBackToCatalog: () => void;
}

/**
 * Componente de pantalla de resultado de pago con variantes visuales
 * para cada estado: approved, rejected, error, pending.
 */
export function PaymentResultScreen({
  orderId,
  onRetry,
  onViewOrders,
  onBackToCatalog,
}: PaymentResultScreenProps) {
  const status = usePaymentStore((state) => state.status);
  const mpPaymentId = usePaymentStore((state) => state.mpPaymentId);
  const statusDetail = usePaymentStore((state) => state.statusDetail);
  const error = usePaymentStore((state) => state.error);

  const btnStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnStyle,
    background: '#007bff',
    color: 'white',
  };

  const secondaryBtn: React.CSSProperties = {
    ...btnStyle,
    background: '#f0f0f0',
    color: '#374151',
    border: '1px solid #d1d5db',
  };

  if (status === 'approved') {
    return (
      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}>
          ✅
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: '#166534' }}>¡Pago aprobado!</h2>
        <p style={{ color: '#15803d', margin: '0 0 4px 0', fontSize: '15px' }}>
          Tu pago fue procesado correctamente.
        </p>
        {mpPaymentId && (
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 20px 0' }}>
            ID de pago: {mpPaymentId}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onViewOrders} style={primaryBtn}>
            Ver mi pedido
          </button>
          <button onClick={onBackToCatalog} style={secondaryBtn}>
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}>
          ❌
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Pago rechazado</h2>
        <p style={{ color: '#b91c1c', margin: '0 0 4px 0', fontSize: '15px' }}>
          El pago no pudo procesarse. Intentá con otro medio de pago.
        </p>
        {statusDetail && (
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 20px 0' }}>
            Detalle: {statusDetail}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRetry} style={primaryBtn}>
            Intentar de nuevo
          </button>
          <button onClick={onBackToCatalog} style={secondaryBtn}>
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}>
          ⚠️
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: '#92400e' }}>Error de pago</h2>
        <p style={{ color: '#92400e', margin: '0 0 4px 0', fontSize: '15px' }}>
          {error || 'Ocurrió un error al procesar el pago.'}
        </p>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 20px 0' }}>
          Si el problema persiste, contactate con soporte.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRetry} style={primaryBtn}>
            Intentar de nuevo
          </button>
          <button onClick={onBackToCatalog} style={secondaryBtn}>
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}>
          ⏳
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Pago pendiente</h2>
        <p style={{ color: '#1d4ed8', margin: '0 0 20px 0', fontSize: '15px' }}>
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onViewOrders} style={primaryBtn}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    );
  }

  // Idle / no status — no render
  return null;
}
