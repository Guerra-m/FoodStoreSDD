import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { AboutSection } from '../components/landing/AboutSection';
import { FeaturedProductsSection } from '../components/landing/FeaturedProductsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ContactSection } from '../components/landing/ContactSection';

/**
 * LandingPage component
 * Main landing page with navbar, hero, about, featured products, how it works, and contact sections
 * Includes scroll-to-section navigation with active state tracking
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('hero');

  // Create refs for each section
  const sectionRefs = {
    hero: useRef<HTMLElement>(null),
    about: useRef<HTMLElement>(null),
    'featured-products': useRef<HTMLElement>(null),
    'how-it-works': useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null),
  };

  // Navbar links
  const navbarLinks = [
    { id: 'hero', label: 'Inicio' },
    { id: 'about', label: 'Sobre Nosotros' },
    { id: 'featured-products', label: 'Productos' },
    { id: 'how-it-works', label: 'Cómo Funciona' },
    { id: 'contact', label: 'Contacto' },
  ];

  // Handle scroll-to-section navigation
  const handleNavClick = (sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Track active section using Intersection Observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section refs
    Object.values(sectionRefs).forEach((ref) => {
      if (ref?.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle "Pedir ahora" button click
  const handlePedir = () => {
    navigate('/catalog');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <LandingNavbar
        links={navbarLinks}
        onLinkClick={handleNavClick}
        activeSection={activeSection}
      />

      {/* Hero Section */}
      <HeroSection
        ref={sectionRefs.hero}
        title="¡Bienvenido a Food Store!"
        description="Descubre nuestros productos frescos, de calidad, entregados en tu puerta"
        buttonLabel="Pedir ahora 🛒"
        onButtonClick={handlePedir}
      />

      {/* About Section */}
      <AboutSection ref={sectionRefs.about} />

      {/* Featured Products Section */}
      <FeaturedProductsSection ref={sectionRefs['featured-products']} />

      {/* How It Works Section */}
      <HowItWorksSection ref={sectionRefs['how-it-works']} />

      {/* Contact Section */}
      <ContactSection ref={sectionRefs.contact} />
    </div>
  );
};

