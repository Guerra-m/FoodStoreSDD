import { useDroppable } from '@dnd-kit/core';
import type { AdminOrderSummary } from '../types/admin';
import { OrderCard } from './OrderCard';

interface StatusColumnProps {
  id: string;
  title: string;
  color: string;
  orders: AdminOrderSummary[];
  isOver?: boolean;
}

export function StatusColumn({ id, title, color, orders, isOver: forceOver }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const showHighlight = forceOver || isOver;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[180px] bg-gray-50 rounded-xl border-2 flex flex-col max-h-full
        ${showHighlight ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        transition-colors duration-150
      `}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        </div>
        <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {orders.length === 0 && (
          <div className="text-gray-300 text-xs text-center py-8">
            Sin pedidos
          </div>
        )}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
