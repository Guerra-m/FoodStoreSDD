import { useState } from 'react';
import { usePublicProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCartStore } from '../stores/cartStore';
import { SkeletonCard } from '../components/SkeletonCard';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import type { ProductoPublic } from '../api/products';

export default function Catalogo() {
  const [filters, setFilters] = useState({
    categoria_id: undefined as number | undefined,
    search: '',
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    page: 1,
    per_page: 20,
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductoPublic | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data, isLoading, error } = usePublicProducts({
    ...filters,
    search: filters.search || undefined,
  });
  const { data: categorias } = useCategories();
  const addItem = useCartStore((state) => state.addItem);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getQty = (productId: number) => quantities[productId] ?? 1;

  const setQty = (productId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const handleAddToCart = (product: ProductoPublic, qty: number) => {
    addItem({
      productoId: product.id,
      nombre: product.nombre,
      priceInCents: product.price_in_cents,
      cantidad: qty,
    });
    toast.success(`${qty}x ${product.nombre} agregado al carrito`);
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <div className="p-5">
      <h1>Catálogo de Productos</h1>

      {/* Filters */}
      <div className="mb-5 p-4 border border-gray-200 rounded-lg flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar:</label>
          <input
            type="text"
            placeholder="Nombre del producto..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría:</label>
          <select
            value={filters.categoria_id || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                categoria_id: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio mín:</label>
          <input
            type="number"
            placeholder="Ej: 10000"
            value={filters.min_price !== undefined ? filters.min_price / 100 : ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                min_price: e.target.value !== '' ? Math.round(Number(e.target.value) * 100) : undefined,
                page: 1,
              })
            }
            className="w-[110px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio máx:</label>
          <input
            type="number"
            placeholder="Ej: 50000"
            value={filters.max_price !== undefined ? filters.max_price / 100 : ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                max_price: e.target.value !== '' ? Math.round(Number(e.target.value) * 100) : undefined,
                page: 1,
              })
            }
            className="w-[110px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            step="0.01"
          />
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5"
          aria-busy="true"
          aria-label="Cargando catálogo"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          Error al cargar el catálogo
        </div>
      ) : data && data.productos.length > 0 ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {data.productos.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.nombre}
                    className="w-full h-[180px] object-cover cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  />
                ) : (
                  <div
                    className="w-full h-[180px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <h3
                    className="m-0 mb-1 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.nombre}
                  </h3>
                  <p
                    className="text-gray-500 text-sm flex-1 line-clamp-2 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.descripcion || 'Sin descripción'}
                  </p>
                  {product.ingredientes.length > 0 && (
                    <div className="mt-2 mb-2 text-xs text-gray-400 line-clamp-1">
                      {product.ingredientes.map((i) => i.nombre).join(', ')}
                    </div>
                  )}

                  {/* ── Footer: precio arriba, botones abajo ── */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <strong className="text-lg text-gray-900">
                      {formatPrice(product.price_in_cents)}
                    </strong>
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setQty(product.id, getQty(product.id) - 1)}
                          disabled={getQty(product.id) <= 1}
                          className="w-7 h-7 flex items-center justify-center text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-200"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-gray-700">
                          {getQty(product.id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, getQty(product.id) + 1)}
                          className="w-7 h-7 flex items-center justify-center text-sm font-medium bg-gray-50 hover:bg-gray-100 border-l border-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <Button onClick={() => handleAddToCart(product, getQty(product.id))} size="sm">
                        Agregar
                      </Button>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="px-2.5 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-5 flex justify-center items-center gap-3">
            <Button
              variant="secondary" size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {filters.page} ({data.total} productos)
            </span>
            <Button
              variant="secondary" size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page * filters.per_page >= data.total}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No se encontraron productos.</p>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold border-0 cursor-pointer z-10"
            >
              ✕
            </button>

            {selectedProduct.images && selectedProduct.images.length > 0 ? (
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.nombre}
                className="w-full h-[200px] object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-[200px] bg-gray-100 flex items-center justify-center rounded-t-lg text-gray-400">
                Sin imagen
              </div>
            )}

            <div className="p-5">
              <h2 className="text-xl font-bold mb-2">{selectedProduct.nombre}</h2>
              <p className="text-gray-600 mb-3">
                {selectedProduct.descripcion || 'Sin descripción'}
              </p>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                {formatPrice(selectedProduct.price_in_cents)}
              </p>

              {selectedProduct.ingredientes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Ingredientes:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedProduct.ingredientes.map((ing) => (
                      <li key={ing.ingrediente_id}>
                        {ing.nombre} ({ing.cantidad} {ing.unidad_medida})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) - 1)}
                    disabled={getQty(selectedProduct.id) <= 1}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-base font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-base font-medium">
                    {getQty(selectedProduct.id)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) + 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-base font-medium hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <Button onClick={() => handleAddToCart(selectedProduct, getQty(selectedProduct.id))}>
                  Agregar al carrito
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium border-0 cursor-pointer hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
