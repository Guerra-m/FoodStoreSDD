import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/uiStore';

export function Header() {
  const { user } = useAuth();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* Hamburguesa — solo mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            /* X icon */
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <h1 className="text-xl font-bold text-gray-800">FoodStore</h1>
      </div>
      {user && (
        <span className="text-sm text-gray-500">
          {user.nombre || user.email}
        </span>
      )}
    </header>
  );
}
