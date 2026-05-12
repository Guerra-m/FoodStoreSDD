import React from 'react';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Acceso Denegado</h1>
      <p>No tenés los permisos necesarios para ver esta página.</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Volver al inicio
      </button>
    </div>
  );
};
