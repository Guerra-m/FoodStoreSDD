import { useParams, Link } from 'react-router-dom';
import { usePublicProductById } from '../../shared/hooks/useProducts';

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = usePublicProductById(Number(id));

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isLoading) return <div>Cargando producto...</div>;
  if (error || !product) return <div>Producto no encontrado</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/catalog" style={{ marginBottom: '20px', display: 'block' }}>
        &larr; Volver al catálogo
      </Link>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Image gallery */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {product.images && product.images.length > 0 ? (
            <div>
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.nombre} - ${idx + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px',
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '300px',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#999',
              }}
            >
              Sin imagen
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1>{product.nombre}</h1>
          <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
            {product.descripcion || 'Sin descripción'}
          </p>

          <h2 style={{ fontSize: '28px', color: '#007bff' }}>
            {formatPrice(product.price_in_cents)}
          </h2>

          {/* Ingredients with allergens */}
          {product.ingredientes && product.ingredientes.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Ingredientes</h3>
              <table
                border={1}
                cellPadding="6"
                style={{ borderCollapse: 'collapse', width: '100%' }}
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
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
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
