import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';

export function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 sm:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIiBmaWxsPSIjZmZmIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bienvenido{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-primary-100 text-lg sm:text-xl max-w-xl">
            Descubrí los mejores productos en nuestro catálogo. Tu próxima comida favorita está a un clic de distancia.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="page-title">Acciones Rápidas</h2>
        <p className="page-subtitle">Navegá rápidamente a las secciones más usadas</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            to="/catalog"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
            title="Catálogo"
            description="Explorá todos nuestros productos"
            color="primary"
          />

          <QuickActionCard
            to="/perfil"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Mi Perfil"
            description="Administrá tus datos personales"
            color="emerald"
          />

          <QuickActionCard
            to="/mis-pedidos"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title="Mis Pedidos"
            description="Seguí el estado de tus pedidos"
            color="amber"
          />

          {isAdmin && (
            <>
              <QuickActionCard
                to="/admin"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                title="Dashboard"
                description="Métricas y estadísticas"
                color="violet"
              />

              <QuickActionCard
                to="/admin/orders"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="Pedidos"
                description="Gestión de pedidos"
                color="rose"
              />

              <QuickActionCard
                to="/categorias"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                }
                title="Categorías"
                description="Administrar categorías"
                color="cyan"
              />
            </>
          )}
        </div>
      </div>

      {/* Features / Benefits */}
      <div>
        <h2 className="page-title">¿Por qué elegirnos?</h2>
        <p className="page-subtitle">Lo que nos hace diferentes</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center" hover>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Entrega Rápida</h3>
            <p className="text-sm text-neutral-500">Reciben tu pedido en tiempo récord</p>
          </Card>

          <Card className="text-center" hover>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Calidad Garantizada</h3>
            <p className="text-sm text-neutral-500">Los mejores ingredientes frescos</p>
          </Card>

          <Card className="text-center" hover>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Pago Seguro</h3>
            <p className="text-sm text-neutral-500">MercadoPago protege tus datos</p>
          </Card>

          <Card className="text-center" hover>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Soporte 24/7</h3>
            <p className="text-sm text-neutral-500">Siempre estamos para ayudarte</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  to,
  icon,
  title,
  description,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-700', icon: 'bg-primary-100 text-primary-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600' },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <Link
      to={to}
      className={`block ${colors.bg} rounded-2xl p-5 hover:shadow-soft-lg transition-all duration-300 group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${colors.icon} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h3 className={`font-semibold ${colors.text} mb-1`}>{title}</h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}