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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <nav style={{ padding: '10px 20px', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
            <a href="/" style={{ marginRight: '15px' }}>Home</a>
            <a href="/catalog" style={{ marginRight: '15px' }}>Catálogo</a>
            <a href="/categorias" style={{ marginRight: '15px' }}>Categorías (Admin)</a>
            <a href="/admin/products" style={{ marginRight: '15px' }}>Productos (Admin)</a>
            <a href="/perfil" style={{ marginRight: '15px' }}>Mi Perfil</a>
            <a href="/login">Login</a>
          </nav>
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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
