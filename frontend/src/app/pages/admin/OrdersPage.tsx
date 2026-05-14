import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listAdminOrders } from '../../../shared/api/adminApi';
import { SkeletonTable } from '../../../shared/components/SkeletonTable';

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
      <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Gestión de Pedidos</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
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
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
          title="Fecha desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
          title="Fecha hasta"
        />
      </div>

      {/* Table */}
      {isLoading && <SkeletonTable rows={8} />}
      {error && <div style={{ color: '#ef4444' }}>Error al cargar pedidos</div>}

      {data && !data.orders.length && (
        <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>No se encontraron pedidos</div>
      )}

      {data && data.orders.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>ID</th>
                <th style={{ padding: '0.6rem' }}>Cliente</th>
                <th style={{ padding: '0.6rem' }}>Total</th>
                <th style={{ padding: '0.6rem' }}>Estado</th>
                <th style={{ padding: '0.6rem' }}>Items</th>
                <th style={{ padding: '0.6rem' }}>Fecha</th>
                <th style={{ padding: '0.6rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>#{order.id}</td>
                  <td style={{ padding: '0.6rem' }}>{order.cliente_nombre}</td>
                  <td style={{ padding: '0.6rem' }}>{formatCurrency(order.total)}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span
                      style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
                        fontSize: '0.75rem', fontWeight: 600,
                        background: `${STATUS_COLORS[order.estado] || '#6b7280'}20`,
                        color: STATUS_COLORS[order.estado] || '#6b7280',
                      }}
                    >
                      {order.estado}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', color: '#6b7280' }}>{order.items_count}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(order.creado_en).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      style={{
                        padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
                        background: '#fff', textDecoration: 'none', color: '#374151', fontSize: '0.8rem',
                      }}
                    >
                      Detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px',
                background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
              }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px',
                background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
              }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
