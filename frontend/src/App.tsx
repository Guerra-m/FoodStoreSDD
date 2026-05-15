import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import CartDrawer from './components/shopping-cart/CartDrawer';
import { useCartCrossTabSync } from './hooks/useCartCrossTabSync';
import { useCartStore, selectCartItemsCount } from './stores/cartStore';
import { useUIStore } from './stores/uiStore';
import { useAuth } from './hooks/useAuth';
import { AppRoutes } from './router';

function Navbar() {
  const items = useCartStore((state) => state.items);
  const count = selectCartItemsCount(items);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  return (
    <nav style={{ padding: '10px 20px', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
      <a href="/" style={{ marginRight: '15px' }}>Home</a>
      <a href="/catalog" style={{ marginRight: '15px' }}>Catálogo</a>
      {isAdmin && <a href="/admin" style={{ marginRight: '15px' }}>Dashboard</a>}
      {isAdmin && <a href="/admin/users" style={{ marginRight: '15px' }}>Usuarios</a>}
      {isAdmin && <a href="/admin/orders" style={{ marginRight: '15px' }}>Pedidos</a>}
      {isAdmin && <a href="/categorias" style={{ marginRight: '15px' }}>Categorías</a>}
      {isAdmin && <a href="/admin/products" style={{ marginRight: '15px' }}>Productos</a>}
      <a href="/perfil" style={{ marginRight: '15px' }}>Mi Perfil</a>
      <a href="/mis-pedidos" style={{ marginRight: '15px' }}>Mis Pedidos</a>
      <a href="/login" style={{ marginRight: '15px' }}>Login</a>

      {/* Cart button with badge */}
      <button
        onClick={toggleCart}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          marginLeft: '10px',
        }}
      >
        🛒 Carrito
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#e74c3c',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </nav>
  );
}

function App() {
  useCartCrossTabSync();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <CartDrawer />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
