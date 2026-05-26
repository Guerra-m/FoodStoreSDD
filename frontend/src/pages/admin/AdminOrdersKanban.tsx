import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { listAdminOrders, updateOrderStatus } from '../../api/admin';
import { useAdminOrdersWebSocket } from '../../hooks/useAdminOrdersWebSocket';
import { StatusColumn } from '../../components/StatusColumn';
import { OrderCard } from '../../components/OrderCard';
import { SkeletonTable } from '../../components/SkeletonTable';
import { getEstadoLabel } from '../../api/orders';
import type { AdminOrderSummary } from '../../types/admin';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; sortOrder: number }> = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b', sortOrder: 0 },
  pagado:     { label: 'Pagado',     color: '#3b82f6', sortOrder: 1 },
  preparando: { label: 'Preparando', color: '#8b5cf6', sortOrder: 2 },
  enviado:    { label: 'Enviado',    color: '#06b6d4', sortOrder: 3 },
  entregado:  { label: 'Entregado',  color: '#10b981', sortOrder: 4 },
  cancelado:  { label: 'Cancelado',  color: '#ef4444', sortOrder: 5 },
};

const STATUS_ORDER = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];

/** Mapa: estado destino → acción FSM */
const TARGET_TO_ACTION: Record<string, string> = {
  pagado: 'pagar',
  preparando: 'preparar',
  enviado: 'enviar',
  entregado: 'entregar',
  cancelado: 'cancelar',
};

// ─── Utils ────────────────────────────────────────────────────────────────────

const groupByStatus = (orders: AdminOrderSummary[]): Record<string, AdminOrderSummary[]> => {
  const groups: Record<string, AdminOrderSummary[]> = {};
  for (const estado of STATUS_ORDER) {
    groups[estado] = [];
  }
  for (const order of orders) {
    const key = order.estado in groups ? order.estado : 'pendiente';
    groups[key].push(order);
  }
  return groups;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminOrdersKanban() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // WebSocket para actualizaciones en tiempo real
  const { connectionStatus } = useAdminOrdersWebSocket();
  const queryClient = useQueryClient();

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', dateFrom, dateTo],
    queryFn: () =>
      listAdminOrders({
        page: 1,
        per_page: 100,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  // Pedidos agrupados por estado
  const ordersByStatus = useMemo(() => {
    if (!data?.orders) return groupByStatus([]);
    return groupByStatus(data.orders);
  }, [data]);

  // Orden activo (para el DragOverlay)
  const activeOrder = useMemo(() => {
    if (!activeId || !data?.orders) return null;
    const id = parseInt(activeId.replace('order-', ''), 10);
    return data.orders.find((o) => o.id === id) || null;
  }, [activeId, data]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      // Determinar source y target
      const orderId = parseInt((active.id as string).replace('order-', ''), 10);
      const targetEstado = over.id as string;

      // Encontrar el pedido
      const order = data?.orders.find((o) => o.id === orderId);
      if (!order) return;

      // No hacer nada si ya está en ese estado
      if (order.estado === targetEstado) return;

      const targetStatus = STATUS_CONFIG[targetEstado];
      if (!targetStatus) return;

      // Determinar la acción FSM
      const accion = TARGET_TO_ACTION[targetEstado];
      if (!accion) return;

      // Validar: cancelado es válido desde cualquier estado no terminal
      // Para otros estados, solo permitir la transición forward
      if (targetEstado !== 'cancelado') {
        const currentIndex = STATUS_ORDER.indexOf(order.estado);
        const targetIndex = STATUS_ORDER.indexOf(targetEstado);
        if (targetIndex <= currentIndex) return; // no retroceder
      }

      // ── Optimistic update: mover la card visualmente de inmediato ──
      const queryKey = ['admin', 'orders', dateFrom, dateTo];
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map((o: AdminOrderSummary) =>
            o.id === orderId ? { ...o, estado: targetEstado } : o
          ),
        };
      });

      try {
        await updateOrderStatus(orderId, { accion });
        toast.success(`Pedido #${orderId} movido a ${getEstadoLabel(targetEstado)}`);
        // Invalidar para asegurar consistencia con el server
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      } catch (err: any) {
        // Revertir al estado anterior en caso de error
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        const msg = err?.response?.data?.detail || err?.message || 'Error al transicionar pedido';
        toast.error(msg);
      }
    },
    [data, dateFrom, dateTo, queryClient],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const connectionBadge = () => {
    const styles: Record<string, string> = {
      connected: 'bg-green-100 text-green-700 border-green-200',
      connecting: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      disconnected: 'bg-red-100 text-red-700 border-red-200',
      fallback: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    const labels: Record<string, string> = {
      connected: 'En vivo',
      connecting: 'Conectando...',
      disconnected: 'Desconectado',
      fallback: 'Polling 30s',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[connectionStatus] || styles.disconnected}`}>
        {labels[connectionStatus] || 'Desconectado'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-900 text-xl font-bold">Gestión de Pedidos</h2>
          {connectionBadge()}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            title="Fecha desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            title="Fecha hasta"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && <SkeletonTable rows={8} />}
      {error && <div className="text-red-500">Error al cargar pedidos</div>}

      {/* Kanban Board */}
      {data && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-[60vh]">
            {STATUS_ORDER.map((estado) => (
              <StatusColumn
                key={estado}
                id={estado}
                title={STATUS_CONFIG[estado].label}
                color={STATUS_CONFIG[estado].color}
                orders={ordersByStatus[estado] || []}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder ? (
              <OrderCard order={activeOrder} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Empty state */}
      {data && !data.orders.length && !isLoading && (
        <div className="text-gray-400 py-12 text-center flex-1 flex items-center justify-center">
          No se encontraron pedidos
        </div>
      )}
    </div>
  );
}
