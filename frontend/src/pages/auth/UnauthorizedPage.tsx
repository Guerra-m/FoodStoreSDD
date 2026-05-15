import { useNavigate } from 'react-router-dom';

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
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};
