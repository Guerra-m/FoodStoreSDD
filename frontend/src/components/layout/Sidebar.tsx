import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore, selectCartItemsCount } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'Admin';
  const items = useCartStore((state) => state.items);
  const count = selectCartItemsCount(items);
  const toggleCart = useUIStore((state) => state.toggleCart);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-700">
        <a href="/" className="text-xl font-bold text-white">FoodStore</a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink href="/" label="Home" />
        <NavLink href="/catalog" label="Catálogo" />

        {user && (
          <>
            <NavLink href="/perfil" label="Mi Perfil" />
            <NavLink href="/mis-pedidos" label="Mis Pedidos" />
          </>
        )}

        {isAdmin && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wide pt-3 pb-1 px-2">
              Admin
            </div>
            <NavLink href="/admin" label="Dashboard" />
            <NavLink href="/admin/users" label="Usuarios" />
            <NavLink href="/admin/orders" label="Pedidos" />
            <NavLink href="/categorias" label="Categorías" />
            <NavLink href="/admin/products" label="Productos" />
          </>
        )}
      </nav>

      {/* Cart button */}
      <div className="px-3 py-3 border-t border-gray-700">
        <button
          onClick={toggleCart}
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
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </a>
        )}
      </div>
    </aside>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = window.location.pathname === href;

  return (
    <a
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-gray-700 text-white font-medium'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {label}
    </a>
  );
}
