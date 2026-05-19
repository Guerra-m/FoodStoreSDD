import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateStock,
} from '../hooks/useProducts';
import {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  ProductoListResponse,
} from '../api/products';
import { useCategories } from '../hooks/useCategories';
import { SkeletonTable } from '../components/SkeletonTable';
import { Button } from '../components/ui/Button';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (cents: number) =>
  `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const centsToDollars = (cents: number) => (cents / 100).toFixed(2);

/* ─── Initial form data ───────────────────────────────────────────────── */

const INITIAL_FORM: ProductoCreate = {
  nombre: '',
  descripcion: '',
  price_in_cents: 0,
  images: [],
  stock: 0,
  is_active: true,
  categoria_ids: [],
  ingredientes: [],
};

/* ─── Component ───────────────────────────────────────────────────────── */

export default function Productos() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProducts(page);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const stockMutation = useUpdateStock();

  /* Form / modal state */
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoCreate>(INITIAL_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Producto | null>(null);
  const [stockEdit, setStockEdit] = useState<{ id: number; value: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Price input — string to avoid cursor jumping with type="number" */
  const [priceInput, setPriceInput] = useState('0.00');

  const { data: categorias } = useCategories();
  const queryClient = useQueryClient();

  const modalRef = useRef<HTMLDivElement>(null);

  /* Close modal on Escape key */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        resetForm();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showForm]);

  /* Focus trap: focus first input when modal opens */
  useEffect(() => {
    if (showForm) {
      const firstInput = modalRef.current?.querySelector<HTMLInputElement>('input');
      firstInput?.focus();
    }
  }, [showForm]);

  /* ── Form handlers ──────────────────────────────────────────────── */

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingProduct(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setFormData(INITIAL_FORM);
    setEditingProduct(null);
    setPriceInput('0.00');
    setShowForm(true);
  };

  const openEdit = (product: Producto) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      price_in_cents: product.price_in_cents,
      images: product.images,
      stock: product.stock,
      is_active: product.is_active,
      categoria_ids: product.categoria_ids,
      ingredientes: product.ingredientes.map((i) => ({
        ingrediente_id: i.ingrediente_id,
        cantidad: i.cantidad,
      })),
    });
    setPriceInput(centsToDollars(product.price_in_cents));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Parse price string -> cents before submitting
    const priceInCents = Math.round(Number(priceInput) * 100);
    if (isNaN(priceInCents) || priceInCents < 0) {
      toast.error('Precio inválido');
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      if (editingProduct) {
        const updateData: ProductoUpdate = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          price_in_cents: priceInCents,
          images: formData.images,
          is_active: formData.is_active,
          categoria_ids: formData.categoria_ids,
        };
        // Ejecuta la mutation y obtiene el producto actualizado
        const updated = await updateMutation.mutateAsync({ id: editingProduct.id, data: updateData });

        // Actualiza la cache DIRECTAMENTE para que la tabla se refresque al instante
        const perPage = 20;
        const listKey: unknown[] = ['products', 'admin', page, perPage];
        const currentList = queryClient.getQueryData<ProductoListResponse>(listKey);
        if (currentList) {
          queryClient.setQueryData<ProductoListResponse>(listKey, {
            ...currentList,
            productos: currentList.productos.map((p) =>
              p.id === updated.id ? updated : p,
            ),
          });
        }

        toast.success('Producto actualizado correctamente');
      } else {
        await createMutation.mutateAsync({ ...formData, price_in_cents: priceInCents });
        toast.success('Producto creado correctamente');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al guardar producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success('Producto eliminado correctamente');
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar producto');
    }
  };

  const handleStockAction = async (
    id: number,
    action: 'set' | 'increment' | 'decrement',
    value: number,
  ) => {
    try {
      await stockMutation.mutateAsync({ id, data: { action, value } });
      setStockEdit(null);
      toast.success('Stock actualizado');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al actualizar stock');
    }
  };

  /* ── Category / ingredient toggles ──────────────────────────────── */

  const toggleCategoria = (catId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoria_ids: prev.categoria_ids?.includes(catId)
        ? prev.categoria_ids.filter((id) => id !== catId)
        : [...(prev.categoria_ids || []), catId],
    }));
  };

  /* ── Category name resolver ─────────────────────────────────────── */

  const getCategoryName = (catId: number): string =>
    categorias?.find((c) => c.id === catId)?.nombre || String(catId);

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-bold">Gestión de Productos</h2>
        <Button onClick={openCreate}>
          + Nuevo Producto
        </Button>
      </div>

      {/* ── Loading state ──────────────────────────────────────────── */}
      {isLoading && (
        <div aria-busy="true" aria-label="Cargando productos">
          <SkeletonTable rows={8} />
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          Error al cargar productos. Intente nuevamente.
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {data && !data.productos.length && (
        <div className="text-gray-400 py-12 text-center border border-dashed border-gray-300 rounded-lg">
          <p className="text-base mb-2">No hay productos todavía</p>
          <Button onClick={openCreate}>
            + Crear primer producto
          </Button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      {data && data.productos.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* ↓ table-fixed: respeta los w-[...] declarados en <th> */}
            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                {/* ↓ text-nowrap: evita que los headers se partan en varias líneas */}
                <tr className="border-b-2 border-gray-200 text-gray-500 text-left text-nowrap">
                  <th className="p-3 font-semibold w-[60px]">ID</th>
                  <th className="p-3 font-semibold">Nombre</th>
                  <th className="p-3 font-semibold w-[120px]">Precio</th>
                  <th className="p-3 font-semibold w-[180px]">Stock</th>
                  <th className="p-3 font-semibold w-[80px]">Activo</th>
                  <th className="p-3 font-semibold">Categorías</th>
                  <th className="p-3 font-semibold w-[150px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.productos.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-500">#{product.id}</td>
                    {/* ↓ max-w-0 + overflow-hidden: activa el truncate del span interno */}
                    <td className="p-3 font-medium text-gray-900 max-w-0 overflow-hidden">
                      <span className="block truncate">{product.nombre}</span>
                      {product.descripcion && (
                        <span className="block text-xs text-gray-400 font-normal mt-0.5 truncate">
                          {product.descripcion}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-900">
                      {formatPrice(product.price_in_cents)}
                    </td>
                    <td className="p-3">
                      {stockEdit?.id === product.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={stockEdit.value}
                            onChange={(e) =>
                              setStockEdit({ id: product.id, value: e.target.value })
                            }
                            className="w-[70px] px-2 py-1 border border-gray-300 rounded text-sm"
                            min={0}
                            autoFocus
                          />
                          <Button
                            variant="secondary" size="sm"
                            onClick={() =>
                              handleStockAction(product.id, 'set', Number(stockEdit.value))
                            }
                          >
                            OK
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setStockEdit(null)}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock}
                          </span>
                          <div className="flex items-center gap-0.5 ml-1">
                            <Button
                              variant="secondary" size="sm"
                              onClick={() => handleStockAction(product.id, 'increment', 1)}
                              title="Incrementar stock"
                            >
                              +1
                            </Button>
                            <Button
                              variant="secondary" size="sm"
                              onClick={() =>
                                product.stock > 0 && handleStockAction(product.id, 'decrement', 1)
                              }
                              title="Decrementar stock"
                              disabled={product.stock <= 0}
                            >
                              -1
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() =>
                                setStockEdit({ id: product.id, value: String(product.stock) })
                              }
                              title="Editar stock"
                            >
                              ✎
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {product.is_active ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 text-xs">
                      {product.categoria_ids.length > 0
                        ? product.categoria_ids.map(getCategoryName).join(', ')
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center flex-wrap gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => openEdit(product)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger" size="sm"
                          onClick={() => setDeleteConfirm(product)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ──────────────────────────────────────────── */}
          <div className="flex justify-center items-center gap-3 mt-6">
            <Button
              variant="secondary" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Página <strong>{page}</strong> — {data?.total ?? 0} productos
            </span>
            <Button
              variant="secondary" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page * 20 >= data.total}
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar Producto
          ═══════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-[1000] py-10 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="product-modal-title" className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <Button
                variant="ghost" size="sm"
                onClick={resetForm}
                aria-label="Cerrar"
                className="p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Nombre */}
              <div>
                <label htmlFor="prod-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  id="prod-nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del producto"
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="prod-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="prod-desc"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Descripción del producto"
                />
              </div>

              {/* Precio + Stock row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      id="prod-price"
                      type="text"
                      inputMode="decimal"
                      value={priceInput}
                      onChange={(e) => {
                        // Only allow digits, one dot, and leading minus
                        const val = e.target.value;
                        if (/^-?\d*\.?\d{0,2}$/.test(val) || val === '') {
                          setPriceInput(val);
                        }
                      }}
                      onBlur={() => {
                        // Format to 2 decimals on blur
                        const num = Number(priceInput);
                        if (!isNaN(num)) {
                          setPriceInput(num.toFixed(2));
                        }
                      }}
                      required
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {!editingProduct && (
                  <div>
                    <label htmlFor="prod-stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock inicial
                    </label>
                    <input
                      id="prod-stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: Number(e.target.value) })
                      }
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Activo + Imágenes */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Producto activo</span>
                </label>
              </div>

              <div>
                <label htmlFor="prod-images" className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes (URLs)
                </label>
                <input
                  id="prod-images"
                  type="text"
                  value={formData.images?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/imagen.jpg, https://ejemplo.com/otra.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">Separar múltiples URLs con coma</p>
              </div>

              {/* Categorías */}
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Categorías</span>
                {!categorias || categorias.length === 0 ? (
                  <p className="text-xs text-gray-400">No hay categorías disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categorias.map((cat) => {
                      const selected = formData.categoria_ids?.includes(cat.id) || false;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategoria(cat.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {cat.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>


              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 -mx-6 px-6 -mb-4 pb-4">
                <Button
                  variant="secondary" size="md"
                  type="button"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                >
                  {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Confirmar Eliminación
          ═══════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de eliminar <strong>"{deleteConfirm.nombre}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary" size="md"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger" size="md"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                loading={deleteMutation.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
