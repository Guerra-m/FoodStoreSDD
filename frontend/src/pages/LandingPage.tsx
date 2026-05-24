import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePedir = () => {
    navigate('/catalog');
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection
        title="¡Bienvenido a Food Store!"
        description="Descubre nuestros productos frescos, de calidad, entregados en tu puerta"
        buttonLabel="Pedir ahora"
        onButtonClick={handlePedir}
      />
    </div>
  );
};
