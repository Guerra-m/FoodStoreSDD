import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '../index.css';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import MiPerfil from './pages/MiPerfil';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <nav style={{ padding: '10px 20px', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
          <a href="/" style={{ marginRight: '15px' }}>Home</a>
          <a href="/categorias" style={{ marginRight: '15px' }}>Categorías (Admin)</a>
          <a href="/admin/products" style={{ marginRight: '15px' }}>Productos (Admin)</a>
          <a href="/catalog" style={{ marginRight: '15px' }}>Catálogo</a>
          <a href="/perfil">Mi Perfil</a>
        </nav>
        <Routes>
          <Route path="/" element={<h1>Food Store Home</h1>} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/admin/products" element={<Productos />} />
          <Route path="/catalog" element={<Catalogo />} />
          <Route path="/catalog/:id" element={<ProductoDetalle />} />
          <Route path="/perfil" element={<MiPerfil />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
