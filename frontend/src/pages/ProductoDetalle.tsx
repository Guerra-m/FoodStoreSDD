import { useParams, Link } from 'react-router-dom';
import { usePublicProductById } from '../hooks/useProducts';
import AddToCartButton from '../components/shopping-cart/AddToCartButton';
import type { IngredientOption } from '../components/shopping-cart/AddToCartButton';
import { SkeletonDetail } from '../components/SkeletonDetail';

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = usePublicProductById(Number(id));

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isLoading) return <SkeletonDetail />;
  if (error || !product) return <div>Producto no encontrado</div>;

  const ingredientes: IngredientOption[] = (product.ingredientes ?? []).map((ing) => ({
    ingredienteId: ing.ingrediente_id,
    nombre: ing.nombre,
  }));

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link to="/catalog" className="mb-5 block">
        &larr; Volver al catálogo
      </Link>

      <div className="flex gap-8 flex-wrap">
        {/* Image gallery */}
        <div className="flex-1 min-w-[300px]">
          {product.images && product.images.length > 0 ? (
            <div>
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.nombre} - ${idx + 1}`}
                  className="w-full max-h-[400px] object-cover rounded-lg mb-3"
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-[300px]">
          <h1>{product.nombre}</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            {product.descripcion || 'Sin descripción'}
          </p>

          <h2 className="text-[28px] text-blue-600">
            {formatPrice(product.price_in_cents)}
          </h2>

          {/* Add to cart */}
          <div className="mt-5">
            <AddToCartButton
              productoId={product.id}
              nombre={product.nombre}
              priceInCents={product.price_in_cents}
              ingredientes={ingredientes}
            />
          </div>

          {/* Ingredients with allergens */}
          {product.ingredientes && product.ingredientes.length > 0 && (
            <div className="mt-8">
              <h3>Ingredientes</h3>
              <table
                border={1}
                cellPadding="6"
                className="border-collapse w-full"
              >
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {product.ingredientes.map((ing) => (
                    <tr key={ing.ingrediente_id}>
                      <td>{ing.nombre}</td>
                      <td>{ing.cantidad}</td>
                      <td>{ing.unidad_medida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Allergen alert */}
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm">
                <strong>⚠️ Información de alérgenos:</strong> Este producto contiene{' '}
                {product.ingredientes.map((i) => i.nombre).join(', ')}.
                Consulte con el personal si tiene alguna alergia o intolerancia
                alimentaria.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
