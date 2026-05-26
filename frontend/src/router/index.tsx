import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';
import { LandingPage } from '../pages/LandingPage';
import { HomePage } from '../pages/HomePage';
import Categorias from '../pages/Categorias';
import Productos from '../pages/Productos';
import Catalogo from '../pages/Catalogo';
import ProductoDetalle from '../pages/ProductoDetalle';
import MiPerfil from '../pages/MiPerfil';
import MisPedidos from '../pages/MisPedidos';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import PaymentResultPage from '../pages/PaymentResultPage';
import { AdminLayout } from '../components/admin/AdminLayout';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { OrdersPage } from '../pages/admin/OrdersPage';
import { OrderDetailPage } from '../pages/admin/OrderDetailPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — sin sidebar ni layout */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Routes con layout completo — requieren autenticación */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<Catalogo />} />
        <Route path="/catalog/:id" element={<ProductoDetalle />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/perfil" element={<MiPerfil />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/mis-pedidos/:id/tracking" element={<OrderTrackingPage />} />

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

        {/* Admin Routes — requieren rol Admin ADEMÁS de autenticación */}
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
      </Route>
    </Routes>
  );
}
