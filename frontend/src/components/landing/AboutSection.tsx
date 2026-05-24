import React, { forwardRef } from 'react';

/**
 * AboutSection component
 * Displays brand story and 3 value propositions with emojis
 */
export const AboutSection = forwardRef<HTMLElement>((_, ref) => {
  const valueProps = [
    {
      icon: '🥗',
      title: 'Productos Frescos',
      description: 'Seleccionamos ingredientes de la mejor calidad, directamente de nuestros proveedores de confianza.',
    },
    {
      icon: '⚡',
      title: 'Entrega Rápida',
      description: 'Recibe tu pedido en menos de 30 minutos. Operamos en tiempo real para tu comodidad.',
    },
    {
      icon: '✅',
      title: 'Garantía de Satisfacción',
      description: 'Si no estás satisfecho, te devolvemos tu dinero. Tu satisfacción es nuestra prioridad.',
    },
  ];

  return (
    <section ref={ref} id="about" className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-food-green mb-4">
            Sobre Nosotros
          </h2>
          <div className="w-16 h-1 bg-food-orange rounded-full mb-6"></div>
          <p className="text-lg md:text-xl text-neutral-700 max-w-3xl leading-relaxed">
            En Food Store, creemos que la calidad y la rapidez no son incompatibles. Desde nuestros inicios, nos dedicamos a llevar los mejores productos a tu mesa, frescos y deliciosos, en el menor tiempo posible.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="p-6 md:p-8 bg-food-cream rounded-xl border-2 border-food-orange/20 hover:border-food-orange/50 transition-all duration-300 hover:shadow-soft-lg"
            >
              <div className="text-5xl md:text-6xl mb-4">{prop.icon}</div>
              <h3 className="text-xl md:text-2xl font-bold text-food-green mb-3">{prop.title}</h3>
              <p className="text-neutral-700 leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';

