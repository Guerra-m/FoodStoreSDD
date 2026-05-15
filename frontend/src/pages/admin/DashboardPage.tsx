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

function SummaryCards({ stats }: { stats: { total_users: number; total_orders: number; total_revenue: number } }) {
  const cards = [
    { label: 'Usuarios', value: stats.total_users, color: 'text-blue-500' },
    { label: 'Pedidos', value: stats.total_orders, color: 'text-emerald-500' },
    { label: 'Ingresos', value: formatCurrency(stats.total_revenue), color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">{card.label}</div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

function RevenueChart({ data }: { data: { fecha: string; ingreso_total: number }[] }) {
  if (!data.length) {
    return <div className="text-gray-400 py-8 text-center">Sin datos de ingresos</div>;
  }

  const chartData = data.map((d) => ({
    fecha: d.fecha.slice(5),
    ingresos: d.ingreso_total / 100,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="m-0 mb-4 text-base text-gray-900">Ingresos en el tiempo</h3>
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

function OrdersByStatusChart({ data }: { data: { estado: string; cantidad: number }[] }) {
  if (!data.length) {
    return <div className="text-gray-400 py-8 text-center">Sin pedidos</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="m-0 mb-4 text-base text-gray-900">Pedidos por Estado</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="estado"
            cx="50%" cy="50%" outerRadius={90}
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

function TopProductsTable({ data }: { data: { id: number; nombre: string; cantidad_vendida: number; ingreso_total: number }[] }) {
  if (!data.length) {
    return <div className="text-gray-400 py-8 text-center">Sin ventas aún</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="m-0 mb-4 text-base text-gray-900">Productos más vendidos</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
            <th className="p-2">#</th>
            <th className="p-2">Producto</th>
            <th className="p-2">Cant.</th>
            <th className="p-2">Ingreso</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, idx) => (
            <tr key={p.id} className="border-b border-gray-100">
              <td className="p-2 text-gray-400">{idx + 1}</td>
              <td className="p-2">{p.nombre}</td>
              <td className="p-2">{p.cantidad_vendida}</td>
              <td className="p-2">{formatCurrency(p.ingreso_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        <h2 className="mb-4 text-gray-900">Dashboard</h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-2"><Skeleton width="50%" height={14} /></div>
              <Skeleton width="40%" height={28} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4"><Skeleton width="40%" height={18} /></div>
            <Skeleton shape="rect" width="100%" height={260} />
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4"><Skeleton width="40%" height={18} /></div>
            <Skeleton shape="rect" width="100%" height={260} />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mt-4">
          <div className="mb-4"><Skeleton width="40%" height={18} /></div>
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-gray-900 text-xl font-bold">Dashboard</h2>

      {stats && <SummaryCards stats={stats} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {revenue && <RevenueChart data={revenue.data} />}
        {stats && <OrdersByStatusChart data={stats.orders_by_status} />}
      </div>

      {topProducts && <TopProductsTable data={topProducts.data} />}
    </div>
  );
}
