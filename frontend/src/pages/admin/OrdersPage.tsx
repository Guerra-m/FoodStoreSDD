import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listAdminOrders } from '../../api/admin';
import { SkeletonTable } from '../../components/SkeletonTable';
import { Button } from '../../components/ui/Button';

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  pagado: '#3b82f6',
  preparando: '#8b5cf6',
  enviado: '#06b6d4',
  entregado: '#10b981',
  cancelado: '#ef4444',
};

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', page, estadoFilter, dateFrom, dateTo],
    queryFn: () =>
      listAdminOrders({
        page,
        per_page: 20,
        estado: estadoFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div>
      <h2 className="mb-4 text-gray-900 text-xl font-bold">Gestión de Pedidos</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="preparando">Preparando</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
          title="Fecha desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
          title="Fecha hasta"
        />
      </div>

      {/* Table */}
      {isLoading && <SkeletonTable rows={8} />}
      {error && <div className="text-red-500">Error al cargar pedidos</div>}

      {data && !data.orders.length && (
        <div className="text-gray-400 py-8 text-center">No se encontraron pedidos</div>
      )}

      {data && data.orders.length > 0 && (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Total</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Items</th>
                <th className="p-2">Fecha</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const color = STATUS_COLORS[order.estado] || '#6b7280';
                return (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="p-2 font-semibold">#{order.id}</td>
                    <td className="p-2">{order.cliente_nombre}</td>
                    <td className="p-2">{formatCurrency(order.total)}</td>
                    <td className="p-2">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {order.estado}
                      </span>
                    </td>
                    <td className="p-2 text-gray-500">{order.items_count}</td>
                    <td className="p-2 text-sm text-gray-500">
                      {new Date(order.creado_en).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-2">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white no-underline text-gray-700 text-xs inline-flex items-center justify-center gap-2 font-medium"
                      >
                        Detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6 items-center">
            <Button
              variant="secondary" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="secondary" size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
