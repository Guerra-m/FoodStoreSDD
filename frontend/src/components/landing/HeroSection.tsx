import { Button } from '../ui/Button';

interface HeroSectionProps {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  description,
  buttonLabel,
  onButtonClick,
  backgroundImage,
}) => {
  return (
    <section
      className="min-h-[500px] md:min-h-[600px] lg:min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-20 lg:py-0"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl">
          {description}
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onButtonClick}
          className="w-full sm:w-auto"
        >
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
};
