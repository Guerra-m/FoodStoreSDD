import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore, selectCartItemsCount } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const items = useCartStore((state) => state.items);
  const count = selectCartItemsCount(items);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const closeSidebar = useUIStore((state) => state.closeSidebar);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay — solo mobile cuando sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'w-60 min-h-screen bg-gray-900 text-gray-100 flex flex-col',
          'fixed inset-y-0 left-0 z-40',
          'transform transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-700">
          <Link to="/" onClick={closeSidebar} className="text-xl font-bold text-white">FoodStore</Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/" label="Home" onClick={closeSidebar} />
          <NavLink to="/catalog" label="Catálogo" onClick={closeSidebar} />

          {user && (
            <>
              <NavLink to="/perfil" label="Mi Perfil" onClick={closeSidebar} />
              <NavLink to="/mis-pedidos" label="Mis Pedidos" onClick={closeSidebar} />
            </>
          )}

          {isAdmin && (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wide pt-3 pb-1 px-2">
                Admin
              </div>
              <NavLink to="/admin" label="Dashboard" onClick={closeSidebar} />
              <NavLink to="/admin/users" label="Usuarios" onClick={closeSidebar} />
              <NavLink to="/admin/orders" label="Pedidos" onClick={closeSidebar} />
              <NavLink to="/categorias" label="Categorías" onClick={closeSidebar} />
              <NavLink to="/admin/products" label="Productos" onClick={closeSidebar} />
            </>
          )}
        </nav>

        {/* Cart button */}
        <div className="px-3 py-3 border-t border-gray-700">
          <button
            onClick={() => { toggleCart(); closeSidebar(); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
          >
            <span>🛒 Carrito</span>
            {count > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>

        {/* User / Login */}
        <div className="px-3 py-3 border-t border-gray-700">
          {user ? (
            <div className="space-y-2">
              <span className="block text-sm text-gray-400 truncate">
                {user.nombre || user.email}
              </span>
              <button
                onClick={() => { handleLogout(); closeSidebar(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeSidebar}
              className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

function NavLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-gray-700 text-white font-medium'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
