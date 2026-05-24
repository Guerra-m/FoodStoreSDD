import { Button } from '../ui/Button';
import { forwardRef } from 'react';

/**
 * HeroSection component for the landing page
 * Features food theme with warm colors, emojis, and enhanced typography
 */
interface HeroSectionProps {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
  backgroundImage?: string;
}

export const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  (
    {
      title,
      description,
      buttonLabel,
      onButtonClick,
      backgroundImage,
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        id="hero"
        className="min-h-[500px] md:min-h-[600px] lg:min-h-screen bg-gradient-to-br from-food-cream via-white to-food-orange-light/20 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-20 lg:py-0 relative overflow-hidden"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 text-6xl md:text-8xl opacity-10 pointer-events-none">🍕</div>
        <div className="absolute bottom-10 left-10 text-6xl md:text-8xl opacity-10 pointer-events-none">🍔</div>

        <div className="max-w-4xl w-full relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl md:text-3xl">🍕</span>
            <span className="text-2xl md:text-3xl">🍔</span>
            <span className="text-2xl md:text-3xl">🥗</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-food-green mb-6 leading-tight">
            {title}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-neutral-700 mb-8 max-w-3xl leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={onButtonClick}
              className="bg-food-orange hover:bg-food-orange/90 text-white"
            >
              {buttonLabel}
            </Button>
            <span className="text-xl">⚡ Entrega rápida y segura</span>
          </div>
        </div>
      </section>
    );
  },
);

HeroSection.displayName = 'HeroSection';

