import { ConnectionStatus } from '../hooks/useOrderWebSocket';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HistorialEntry {
  estado: string;
  descripcion: string;
  timestamp: string;
  usuario_id: number | null;
}

interface OrderTrackingDashboardProps {
  estadoActual: string;
  historial: HistorialEntry[];
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  pedidoId?: number;
  onReconnect?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ESTADOS_ORDEN: string[] = [
  'pendiente',
  'pagado',
  'preparando',
  'enviado',
  'entregado',
];

const ESTADOS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
};

const ESTADOS_ICONS: Record<string, string> = {
  pendiente: '🕐',
  pagado: '💳',
  preparando: '👨‍🍳',
  enviado: '🚚',
  entregado: '✅',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getConnectionBadge = (
  status: ConnectionStatus,
  error: string | null,
  onReconnect?: () => void,
) => {
  switch (status) {
    case 'connected':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#059669',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
            }}
          />
          En vivo
        </span>
      );
    case 'connecting':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#d97706',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }}
          />
          Conectando...
        </span>
      );
    case 'fallback':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#d97706',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'inline-block',
            }}
          />
          Actualizando cada 30s
          {onReconnect && (
            <button
              onClick={onReconnect}
              style={{
                marginLeft: 8,
                padding: '2px 8px',
                fontSize: 11,
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 4,
                cursor: 'pointer',
                color: '#92400e',
              }}
            >
              Reconectar
            </button>
          )}
        </span>
      );
    case 'disconnected':
    default:
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#dc2626',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'inline-block',
            }}
          />
          Desconectado
        </span>
      );
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function OrderTrackingDashboard({
  estadoActual,
  historial,
  connectionStatus,
  connectionError,
  onReconnect,
}: OrderTrackingDashboardProps) {
  const currentIndex = ESTADOS_ORDEN.indexOf(estadoActual);

  // Si el estado es cancelado, mostramos un estado especial
  const esCancelado = estadoActual === 'cancelado';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: 24,
      }}
    >
      {/* Header con badge de conexión */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Estado del Pedido
        </h3>
        {getConnectionBadge(connectionStatus, connectionError, onReconnect)}
      </div>

      {esCancelado ? (
        /* Estado cancelado: mostramos alerta en lugar de la barra */
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 32 }}>❌</span>
          <p style={{ margin: '8px 0 0', fontWeight: 700, color: '#991b1b', fontSize: 16 }}>
            Pedido Cancelado
          </p>
          {historial.length > 0 && (
            <p style={{ margin: '4px 0 0', color: '#7f1d1d', fontSize: 14 }}>
              {historial[historial.length - 1].descripcion}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Barra de progreso */}
          <div style={{ position: 'relative', marginBottom: 32, padding: '0 4px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Línea de fondo (gris) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '8%',
                  right: '8%',
                  height: 3,
                  backgroundColor: '#e5e7eb',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                }}
              />

              {/* Línea de progreso (verde hasta el estado actual) */}
              {currentIndex > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '8%',
                    width: `${(currentIndex / (ESTADOS_ORDEN.length - 1)) * 84}%`,
                    height: 3,
                    backgroundColor: '#10b981',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    transition: 'width 0.5s ease-in-out',
                  }}
                />
              )}

              {/* Círculos de estado */}
              {ESTADOS_ORDEN.map((estado, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isFuture = idx > currentIndex;

                return (
                  <div
                    key={estado}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 2,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: isCurrent ? 44 : 36,
                        height: isCurrent ? 44 : 36,
                        borderRadius: '50%',
                        backgroundColor: isCompleted
                          ? '#10b981'
                          : isCurrent
                            ? '#3b82f6'
                            : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isCurrent ? 20 : 16,
                        color: '#ffffff',
                        boxShadow:
                          isCurrent
                            ? '0 0 0 4px rgba(59, 130, 246, 0.2)'
                            : 'none',
                        transition: 'all 0.3s ease',
                        animation:
                          isCurrent ? 'pulse 2s infinite' : 'none',
                        border:
                          isCurrent
                            ? '3px solid #bfdbfe'
                            : 'none',
                      }}
                    >
                      {isCompleted ? '✓' : ESTADOS_ICONS[estado] || '○'}
                    </div>
                    <span
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCompleted
                          ? '#059669'
                          : isCurrent
                            ? '#2563eb'
                            : '#9ca3af',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ESTADOS_LABELS[estado]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Timeline de eventos (historial) */}
      {historial.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Línea de tiempo
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {[...historial].reverse().map((entry, idx) => {
              const colorIdx = ESTADOS_ORDEN.indexOf(entry.estado);
              const color =
                colorIdx >= 0
                  ? ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#059669'][colorIdx]
                  : '#6b7280';

              return (
                <div
                  key={`${entry.timestamp}-${idx}`}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom:
                      idx < historial.length - 1
                        ? '1px solid #f3f4f6'
                        : 'none',
                  }}
                >
                  {/* Indicador temporal */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: color,
                        marginTop: 4,
                      }}
                    />
                    {idx < historial.length - 1 && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: '#e5e7eb',
                          minHeight: 16,
                        }}
                      />
                    )}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {entry.descripcion}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      {formatDate(entry.timestamp)}
                      {entry.usuario_id && ` · Admin #${entry.usuario_id}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error de conexión */}
      {connectionError && connectionStatus !== 'connected' && (
        <div
          style={{
            marginTop: 16,
            padding: '8px 12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 6,
            fontSize: 12,
            color: '#92400e',
          }}
        >
          {connectionError}
        </div>
      )}

      {/* Animaciones CSS inline */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
