interface PaymentStatusBadgeProps {
  estadoPago: string | null | undefined;
}

// Colores para cada estado de pago
const getPagoColor = (estado: string | null | undefined): string => {
  const colors: Record<string, string> = {
    no_iniciado: '#9ca3af',    // gray
    pendiente: '#f59e0b',      // amber
    en_proceso: '#3b82f6',     // blue
    aprobado: '#10b981',       // green
    rechazado: '#ef4444',      // red
    cancelado: '#6b7280',      // gray dark
  };
  return colors[estado || 'no_iniciado'] || '#9ca3af';
};

// Labels para cada estado de pago
const getPagoLabel = (estado: string | null | undefined): string => {
  const labels: Record<string, string> = {
    no_iniciado: 'Sin pago',
    pendiente: 'Pago pendiente',
    en_proceso: 'Pago en proceso',
    aprobado: 'Pagado',
    rechazado: 'Pago rechazado',
    cancelado: 'Pago cancelado',
  };
  return labels[estado || 'no_iniciado'] || estado || 'Sin pago';
};

export default function PaymentStatusBadge({ estadoPago }: PaymentStatusBadgeProps) {
  const color = getPagoColor(estadoPago);
  const label = getPagoLabel(estadoPago);

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: color,
      }}
    >
      {label}
    </span>
  );
}
