import React, { forwardRef } from 'react';

/**
 * HowItWorksSection component
 * Displays 4-step process with icons and visual connectors
 */
export const HowItWorksSection = forwardRef<HTMLElement>((_, ref) => {
  const steps = [
    {
      icon: '🛒',
      number: '1',
      title: 'Elige tus Productos',
      description: 'Explora nuestro catálogo y selecciona lo que más te apetezca.',
    },
    {
      icon: '🛍️',
      number: '2',
      title: 'Confirma tu Pedido',
      description: 'Revisa tu carrito, completa tus datos y confirma la compra.',
    },
    {
      icon: '💳',
      number: '3',
      title: 'Paga de Forma Segura',
      description: 'Realiza el pago a través de MercadoPago con total seguridad.',
    },
    {
      icon: '🚚',
      number: '4',
      title: 'Recibe tu Pedido',
      description: 'Nuestro equipo entrega tu pedido en el menor tiempo posible.',
    },
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-food-cream">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-food-green mb-4">
            Cómo Funciona
          </h2>
          <div className="w-16 h-1 bg-food-orange rounded-full mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-neutral-700 max-w-3xl mx-auto">
            Cuatro simples pasos para disfrutar de nuestros deliciosos productos en tu casa.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-24 left-[50%] w-[calc(100%-2rem)] h-1 bg-gradient-to-r from-food-orange to-transparent translate-x-4" />
              )}

              {/* Step Card */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 text-center relative z-10">
                <div className="text-5xl md:text-6xl mb-4">{step.icon}</div>
                <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-food-orange text-white font-bold rounded-full text-lg md:text-xl mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-food-green mb-3">{step.title}</h3>
                <p className="text-neutral-700 text-sm md:text-base">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = 'HowItWorksSection';

