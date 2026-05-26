import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { AdminOrderSummary } from '../types/admin';
import { getEstadoLabel, getEstadoColor } from '../api/orders';

const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

const getTimeSince = (dateStr: string): string => {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
};

interface OrderCardProps {
  order: AdminOrderSummary;
  isDragOverlay?: boolean;
}

export function OrderCard({ order, isDragOverlay }: OrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: { order },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const color = getEstadoColor(order.estado);
  const isCanceled = order.estado === 'cancelado';
  const isTerminal = order.estado === 'entregado' || order.estado === 'cancelado';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 cursor-grab
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-400' : 'hover:shadow-md'}
        ${isDragOverlay ? 'shadow-xl rotate-2 scale-105' : ''}
        ${isTerminal ? 'opacity-70 cursor-default' : ''}
        transition-all duration-150 select-none
      `}
      role="button"
      tabIndex={0}
    >
      {/* Header: ID + tiempo */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-gray-800 text-sm">#{order.id}</span>
        <span className="text-[11px] text-gray-400">{getTimeSince(order.creado_en)}</span>
      </div>

      {/* Cliente */}
      <p className="text-gray-700 text-sm font-medium truncate mb-1.5">
        {order.cliente_nombre}
      </p>

      {/* Footer: total + items */}
      <div className="flex justify-between items-center">
        <span className="font-bold text-gray-900 text-sm">
          {formatCurrency(order.total)}
        </span>
        <span className="text-gray-400 text-xs">
          {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
}
