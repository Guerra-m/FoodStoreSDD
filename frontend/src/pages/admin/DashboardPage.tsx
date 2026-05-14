import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import {
  getDashboardStats,
  getDashboardRevenue,
  getDashboardTopProducts,
} from '../../api/admin';
import { Skeleton } from '../../components/Skeleton';
import { SkeletonTable } from '../../components/SkeletonTable';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ stats }: { stats: { total_users: number; total_orders: number; total_revenue: number } }) {
  const cards = [
    { label: 'Usuarios', value: stats.total_users, color: '#3b82f6' },
    { label: 'Pedidos', value: stats.total_orders, color: '#10b981' },
    { label: 'Ingresos', value: formatCurrency(stats.total_revenue), color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.3rem' }}>{card.label}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: card.color }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue Chart ───────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: { fecha: string; ingreso_total: number }[] }) {
  if (!data.length) {
    return <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Sin datos de ingresos</div>;
  }

  const chartData = data.map((d) => ({
    fecha: d.fecha.slice(5), // Mostrar solo MM-DD o MM
    ingresos: d.ingreso_total / 100,
  }));

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#111827' }}>Ingresos en el tiempo</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']} />
          <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Orders by Status Pie ────────────────────────────────────────────────────

function OrdersByStatusChart({ data }: { data: { estado: string; cantidad: number }[] }) {
  if (!data.length) {
    return <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Sin pedidos</div>;
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#111827' }}>Pedidos por Estado</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="estado"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Top Products Table ──────────────────────────────────────────────────────

function TopProductsTable({ data }: { data: { id: number; nombre: string; cantidad_vendida: number; ingreso_total: number }[] }) {
  if (!data.length) {
    return <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Sin ventas aún</div>;
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#111827' }}>Productos más vendidos</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem' }}>#</th>
            <th style={{ padding: '0.5rem' }}>Producto</th>
            <th style={{ padding: '0.5rem' }}>Cant.</th>
            <th style={{ padding: '0.5rem' }}>Ingreso</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, idx) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.5rem', color: '#9ca3af' }}>{idx + 1}</td>
              <td style={{ padding: '0.5rem' }}>{p.nombre}</td>
              <td style={{ padding: '0.5rem' }}>{p.cantidad_vendida}</td>
              <td style={{ padding: '0.5rem' }}>{formatCurrency(p.ingreso_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
  });

  const { data: revenue } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue'],
    queryFn: () => getDashboardRevenue('daily'),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['admin', 'dashboard', 'top-products'],
    queryFn: getDashboardTopProducts,
  });

  if (statsError) {
    toast.error('Error al cargar métricas del dashboard');
  }

  if (statsLoading) {
    return (
      <div aria-busy="true" aria-label="Cargando dashboard">
        <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Dashboard</h2>

        {/* Skeleton summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Skeleton width="50%" height={14} />
              </div>
              <Skeleton width="40%" height={28} />
            </div>
          ))}
        </div>

        {/* Skeleton charts area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Skeleton width="40%" height={18} />
            </div>
            <Skeleton shape="rect" width="100%" height={260} />
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Skeleton width="40%" height={18} />
            </div>
            <Skeleton shape="rect" width="100%" height={260} />
          </div>
        </div>

        {/* Skeleton table */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Skeleton width="40%" height={18} />
          </div>
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#111827' }}>Dashboard</h2>

      {stats && <SummaryCards stats={stats} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          {revenue && <RevenueChart data={revenue.data} />}
        </div>
        <div>
          {stats && <OrdersByStatusChart data={stats.orders_by_status} />}
        </div>
      </div>

      {topProducts && <TopProductsTable data={topProducts.data} />}
    </div>
  );
}
