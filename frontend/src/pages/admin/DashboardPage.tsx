import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
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

function SummaryCards({ stats }: { stats: { total_users: number; total_orders: number; total_revenue: number } }) {
  const cards = [
    {
      label: 'Usuarios',
      value: stats.total_users.toLocaleString('es-AR'),
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Pedidos',
      value: stats.total_orders.toLocaleString('es-AR'),
      color: 'emerald',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(stats.total_revenue),
      color: 'amber',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-neutral-500">{card.label}</span>
            <div className={`w-10 h-10 rounded-xl ${colorClasses[card.color as keyof typeof colorClasses]} flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

function RevenueChart({ data }: { data: { fecha: string; ingreso_total: number }[] }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ingresos en el tiempo</h3>
        <div className="h-[280px] flex items-center justify-center text-neutral-400">
          Sin datos de ingresos
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    fecha: d.fecha.slice(5),
    ingresos: d.ingreso_total / 100,
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ingresos en el tiempo</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="fecha" fontSize={12} stroke="#9ca3af" />
          <YAxis fontSize={12} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrdersByStatusChart({ data }: { data: { estado: string; cantidad: number }[] }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pedidos por Estado</h3>
        <div className="h-[260px] flex items-center justify-center text-neutral-400">
          Sin pedidos
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pedidos por Estado</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="estado"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={4}
            label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProductsTable({ data }: { data: { id: number; nombre: string; cantidad_vendida: number; ingreso_total: number }[] }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Productos más vendidos</h3>
        <div className="h-[200px] flex items-center justify-center text-neutral-400">
          Sin ventas aún
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-soft overflow-hidden">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Productos más vendidos</h3>
      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Producto</th>
              <th className="text-right">Cant.</th>
              <th className="text-right">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, idx) => (
              <tr key={p.id}>
                <td className="text-neutral-400 font-medium">{idx + 1}</td>
                <td className="font-medium text-neutral-800">{p.nombre}</td>
                <td className="text-right">{p.cantidad_vendida}</td>
                <td className="text-right font-medium text-emerald-600">{formatCurrency(p.ingreso_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
        <h2 className="page-title">Dashboard</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton width="40%" height={16} />
                <div className="w-10 h-10 rounded-xl bg-neutral-100" />
              </div>
              <Skeleton width="60%" height={32} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
            <Skeleton width="40%" height={20} className="mb-4" />
            <Skeleton shape="rect" width="100%" height={280} className="rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
            <Skeleton width="40%" height={20} className="mb-4" />
            <Skeleton shape="rect" width="100%" height={280} className="rounded-xl" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
          <Skeleton width="40%" height={20} className="mb-4" />
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h2 className="page-title">Dashboard</h2>
      <p className="page-subtitle">Resumen de métricas y estadísticas</p>

      {stats && <SummaryCards stats={stats} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {revenue && <RevenueChart data={revenue.data} />}
        {stats && <OrdersByStatusChart data={stats.orders_by_status} />}
      </div>

      {topProducts && <TopProductsTable data={topProducts.data} />}
    </div>
  );
}