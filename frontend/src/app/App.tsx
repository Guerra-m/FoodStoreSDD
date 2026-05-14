import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '../index.css';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import MiPerfil from './pages/MiPerfil';
import MisPedidos from './pages/MisPedidos';
import CartDrawer from '../features/shopping-cart/components/CartDrawer';
import { useCartCrossTabSync } from '../features/shopping-cart/hooks/useCartCrossTabSync';
import { useCartStore, selectCartItemsCount } from '../shared/stores/cartStore';
import { useUIStore } from '../shared/stores/uiStore';
import { useAuth } from '../features/auth/hooks/useAuth';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { OrderDetailPage } from './pages/admin/OrderDetailPage';

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
          <Routes>
            <Route path="/" element={<h1>Food Store Home</h1>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/categorias"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Categorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Productos />
                </ProtectedRoute>
              }
            />
            <Route path="/catalog" element={<Catalogo />} />
            <Route path="/catalog/:id" element={<ProductoDetalle />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <MiPerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-pedidos"
              element={
                <ProtectedRoute>
                  <MisPedidos />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
