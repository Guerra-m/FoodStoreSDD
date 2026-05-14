import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicProducts } from '../../shared/hooks/useProducts';
import { useCategories } from '../../shared/hooks/useCategories';
import { useCartStore } from '../../shared/stores/cartStore';
import { SkeletonCard } from '../../shared/components/SkeletonCard';
import { toast } from 'react-toastify';

export default function Catalogo() {
  const [filters, setFilters] = useState({
    categoria_id: undefined as number | undefined,
    search: '',
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    page: 1,
    per_page: 20,
  });

  const { data, isLoading, error } = usePublicProducts({
    ...filters,
    search: filters.search || undefined,
  });
  const { data: categorias } = useCategories();
  const addItem = useCartStore((state) => state.addItem);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Catálogo de Productos</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
          }}
          aria-busy="true"
          aria-label="Cargando catálogo"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div>Error al cargar el catálogo</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Catálogo de Productos</h1>

      {/* Filters */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid #ddd',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'end',
        }}
      >
        <div>
          <label>Buscar: </label>
          <input
            type="text"
            placeholder="Nombre del producto..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
          />
        </div>

        <div>
          <label>Categoría: </label>
          <select
            value={filters.categoria_id || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                categoria_id: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          >
            <option value="">Todas</option>
            {categorias?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Precio mín: </label>
          <input
            type="number"
            placeholder="Ej: 1000"
            value={filters.min_price || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                min_price: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            style={{ width: '100px' }}
            min={0}
          />
        </div>

        <div>
          <label>Precio máx: </label>
          <input
            type="number"
            placeholder="Ej: 5000"
            value={filters.max_price || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                max_price: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            style={{ width: '100px' }}
            min={0}
          />
        </div>
      </div>

      {/* Product Grid */}
      {data && data.productos.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {data.productos.map((product) => (
              <div
                key={product.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.nombre}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '10px',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '150px',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      color: '#999',
                    }}
                  >
                    Sin imagen
                  </div>
                )}
                <h3 style={{ margin: '0 0 5px 0' }}>{product.nombre}</h3>
                <p style={{ color: '#666', fontSize: '14px', flex: 1 }}>
                  {product.descripcion || 'Sin descripción'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                  }}
                >
                  <strong style={{ fontSize: '18px' }}>
                    {formatPrice(product.price_in_cents)}
                  </strong>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        addItem({
                          productoId: product.id,
                          nombre: product.nombre,
                          priceInCents: product.price_in_cents,
                          cantidad: 1,
                        });
                        toast.success(`${product.nombre} agregado al carrito`);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Agregar
                    </button>
                    <Link
                      to={`/catalog/${product.id}`}
                      style={{
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
                {product.ingredientes.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                    Ingredientes: {product.ingredientes.map((i) => i.nombre).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
            >
              Anterior
            </button>
            <span style={{ margin: '0 10px' }}>
              Página {filters.page} ({data.total} productos)
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page * filters.per_page >= data.total}
            >
              Siguiente
            </button>
          </div>
        </>
      ) : (
        <p>No se encontraron productos.</p>
      )}
    </div>
  );
}
