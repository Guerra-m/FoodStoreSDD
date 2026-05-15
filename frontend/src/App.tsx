import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import CartDrawer from './components/shopping-cart/CartDrawer';
import { useCartCrossTabSync } from './hooks/useCartCrossTabSync';
import { AppRoutes } from './router';

function App() {
  useCartCrossTabSync();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
