import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCartStore } from '../stores/cartStore';
import { SkeletonCard } from '../components/SkeletonCard';
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
      <div className="p-5">
        <h1>Catálogo de Productos</h1>
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5"
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
    <div className="p-5">
      <h1>Catálogo de Productos</h1>

      {/* Filters */}
      <div className="mb-5 p-4 border border-gray-200 flex gap-3 flex-wrap items-end">
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
            className="w-[100px]"
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
            className="w-[100px]"
            min={0}
          />
        </div>
      </div>

      {/* Product Grid */}
      {data && data.productos.length > 0 ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {data.productos.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col"
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.nombre}
                    className="w-full h-[150px] object-cover rounded mb-3"
                  />
                ) : (
                  <div className="w-full h-[150px] bg-gray-100 flex items-center justify-center rounded mb-3 text-gray-400">
                    Sin imagen
                  </div>
                )}
                <h3 className="m-0 mb-1">{product.nombre}</h3>
                <p className="text-gray-500 text-sm flex-1">
                  {product.descripcion || 'Sin descripción'}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <strong className="text-lg">
                    {formatPrice(product.price_in_cents)}
                  </strong>
                  <div className="flex gap-1.5">
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
                      className="px-3 py-1.5 bg-green-600 text-white border-none rounded text-sm cursor-pointer"
                    >
                      Agregar
                    </button>
                    <Link
                      to={`/catalog/${product.id}`}
                      className="px-3 py-1.5 bg-blue-600 text-white no-underline rounded text-sm"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
                {product.ingredientes.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Ingredientes: {product.ingredientes.map((i) => i.nombre).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-5 text-center">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
            >
              Anterior
            </button>
            <span className="mx-3">
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
