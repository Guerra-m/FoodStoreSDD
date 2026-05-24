import React, { useEffect, useState, forwardRef } from 'react';
import { ProductoPublic } from '../../api/products';
import api from '../../api/axios';

/**
 * FeaturedProductsSection component
 * Fetches and displays featured products from API with fallback
 */

// Static fallback products for when API is unavailable
const FALLBACK_PRODUCTS: ProductoPublic[] = [
  {
    id: 1,
    nombre: 'Pizza Margherita',
    descripcion: 'Deliciosa pizza con queso mozzarella, tomate fresco y albahaca.',
    price_in_cents: 1500,
    images: ['https://via.placeholder.com/300x200?text=Pizza+Margherita'],
    categoria_ids: [1],
    ingredientes: [],
  },
  {
    id: 2,
    nombre: 'Hamburguesa Clásica',
    descripcion: 'Jugosa hamburguesa con carne de res de primera calidad.',
    price_in_cents: 1200,
    images: ['https://via.placeholder.com/300x200?text=Hamburguesa'],
    categoria_ids: [2],
    ingredientes: [],
  },
  {
    id: 3,
    nombre: 'Ensalada César',
    descripcion: 'Fresca ensalada con lechuga, crutones y aderezo César casero.',
    price_in_cents: 900,
    images: ['https://via.placeholder.com/300x200?text=Ensalada+Cesar'],
    categoria_ids: [3],
    ingredientes: [],
  },
  {
    id: 4,
    nombre: 'Bebida Refrescante',
    descripcion: 'Bebida natural hecha con frutas frescas de la estación.',
    price_in_cents: 500,
    images: ['https://via.placeholder.com/300x200?text=Bebida'],
    categoria_ids: [4],
    ingredientes: [],
  },
];

export const FeaturedProductsSection = forwardRef<HTMLElement>((_, ref) => {
  const [products, setProducts] = useState<ProductoPublic[]>(FALLBACK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get('/productos', {
          params: { limit: 4 },
        });
        
        if (response.data && Array.isArray(response.data)) {
          setProducts(response.data.slice(0, 4));
        } else if (response.data?.productos) {
          setProducts(response.data.productos.slice(0, 4));
        }
      } catch (err) {
        console.warn('Failed to fetch products from API, using fallback:', err);
        setError('No pudimos cargar los productos, mostrando recomendaciones.');
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Format price from cents to currency display
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
    });
  };

  // Get first image from product or use placeholder
  const getImageUrl = (images: string[] | undefined) => {
    if (images && images.length > 0) {
      return images[0];
    }
    return 'https://via.placeholder.com/300x200?text=Producto';
  };

  return (
    <section ref={ref} id="featured-products" className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-food-cream">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-food-green mb-4">
            Productos Destacados
          </h2>
          <div className="w-16 h-1 bg-food-orange rounded-full mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-neutral-700 max-w-3xl mx-auto">
            Descubre nuestros productos más populares. Disponibles ahora mismo.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-accent-warning/10 border border-accent-warning text-neutral-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(isLoading ? Array(4).fill(null) : products).map((product, index) => (
            <div
              key={product?.id || index}
              className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden"
            >
              {/* Product Image */}
              <div className="aspect-video bg-neutral-200 overflow-hidden relative">
                {product ? (
                  <img
                    src={getImageUrl(product.images)}
                    alt={product.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  // Loading skeleton
                  <div className="w-full h-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-shimmer" />
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 md:p-6">
                {product ? (
                  <>
                    <h3 className="text-base md:text-lg font-bold text-food-green mb-2 line-clamp-2">
                      {product.nombre}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {product.descripcion || 'Producto de calidad premium'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg md:text-xl font-bold text-food-orange">
                        {formatPrice(product.price_in_cents)}
                      </span>
                      <button
                        className="px-4 py-2 bg-food-orange text-white rounded-lg font-medium hover:bg-food-orange/90 transition-colors duration-200"
                        aria-label={`Agregar ${product.nombre} al carrito`}
                      >
                        🛒
                      </button>
                    </div>
                  </>
                ) : (
                  // Loading skeleton
                  <div className="space-y-3">
                    <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 bg-neutral-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-neutral-200 rounded w-2/3 animate-pulse" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 bg-neutral-200 rounded w-1/3 animate-pulse" />
                      <div className="h-10 w-10 bg-neutral-200 rounded animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedProductsSection.displayName = 'FeaturedProductsSection';

