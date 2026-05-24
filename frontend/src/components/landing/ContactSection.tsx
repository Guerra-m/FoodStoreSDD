import React, { forwardRef } from 'react';

/**
 * ContactSection component
 * Displays contact information and social links
 */
export const ContactSection = forwardRef<HTMLElement>((_, ref) => {
  const contactInfo = [
    {
      icon: '📧',
      label: 'Email',
      value: 'contacto@foodstore.com',
      href: 'mailto:contacto@foodstore.com',
    },
    {
      icon: '📞',
      label: 'Teléfono',
      value: '+54 (11) 1234-5678',
      href: 'tel:+541112345678',
    },
    {
      icon: '🕐',
      label: 'Horario',
      value: 'Lunes a Domingo, 10:00 - 23:00',
      href: null,
    },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: '👍', url: 'https://facebook.com' },
    { name: 'Instagram', icon: '📸', url: 'https://instagram.com' },
    { name: 'Twitter', icon: '𝕏', url: 'https://twitter.com' },
    { name: 'WhatsApp', icon: '💬', url: 'https://whatsapp.com' },
  ];

  return (
    <section ref={ref} id="contact" className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-food-green mb-4">
            Ponte en Contacto
          </h2>
          <div className="w-16 h-1 bg-food-orange rounded-full mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-neutral-700 max-w-3xl mx-auto">
            ¿Preguntas o sugerencias? Nos encantaría escucharte. Contáctanos por cualquiera de estos medios.
          </p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl mb-4">{info.icon}</div>
              <h3 className="text-lg md:text-xl font-bold text-food-green mb-2">{info.label}</h3>
              {info.href ? (
                <a
                  href={info.href}
                  className="text-neutral-700 hover:text-food-orange transition-colors duration-200 break-all"
                >
                  {info.value}
                </a>
              ) : (
                <p className="text-neutral-700">{info.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="bg-food-cream rounded-xl p-8 md:p-12">
          <h3 className="text-xl md:text-2xl font-bold text-food-green text-center mb-8">
            Síguenos en Redes Sociales
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white border-2 border-food-orange rounded-full hover:bg-food-orange hover:text-white transition-all duration-200 text-2xl md:text-3xl"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

ContactSection.displayName = 'ContactSection';

