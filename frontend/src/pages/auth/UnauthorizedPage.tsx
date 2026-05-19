import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-red-400 mb-4">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 mb-6">
          No tenés los permisos necesarios para ver esta página.
        </p>
        <Button onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};
