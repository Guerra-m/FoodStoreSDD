import { useState } from 'react';
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
  ProductoIngredienteData,
} from '../api/products';
import { useCategories } from '../hooks/useCategories';
import { useIngredientes } from '../hooks/useIngredientes';

export default function Productos() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProducts(page);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const stockMutation = useUpdateStock();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Producto | null>(null);
  const [stockEdit, setStockEdit] = useState<{ id: number; value: string } | null>(null);
  const [formData, setFormData] = useState<ProductoCreate>({
    nombre: '',
    descripcion: '',
    price_in_cents: 0,
    images: [],
    stock: 0,
    is_active: true,
    categoria_ids: [],
    ingredientes: [],
  });

  const { data: categorias } = useCategories();
  const { data: ingredientes } = useIngredientes();

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      price_in_cents: 0,
      images: [],
      stock: 0,
      is_active: true,
      categoria_ids: [],
      ingredientes: [],
    });
    setEditingProduct(null);
    setShowForm(false);
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
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updateData: ProductoUpdate = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          price_in_cents: formData.price_in_cents,
          images: formData.images,
          is_active: formData.is_active,
          categoria_ids: formData.categoria_ids,
          ingredientes: formData.ingredientes?.map((i) => ({
            ingrediente_id: i.ingrediente_id,
            cantidad: i.cantidad,
          })),
        };
        await updateMutation.mutateAsync({ id: editingProduct.id, data: updateData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar producto');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar producto');
    }
  };

  const handleStockAction = async (
    id: number,
    action: 'set' | 'increment' | 'decrement',
    value: number
  ) => {
    try {
      await stockMutation.mutateAsync({ id, data: { action, value } });
      setStockEdit(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al actualizar stock');
    }
  };

  const toggleCategoria = (catId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoria_ids: prev.categoria_ids?.includes(catId)
        ? prev.categoria_ids.filter((id) => id !== catId)
        : [...(prev.categoria_ids || []), catId],
    }));
  };

  const updateIngrediente = (ingId: number, cantidad: number) => {
    setFormData((prev) => {
      const existing = prev.ingredientes?.find(
        (i) => i.ingrediente_id === ingId
      );
      if (existing) {
        return {
          ...prev,
          ingredientes: prev.ingredientes?.map((i) =>
            i.ingrediente_id === ingId ? { ...i, cantidad } : i
          ),
        };
      }
      return {
        ...prev,
        ingredientes: [...(prev.ingredientes || []), { ingrediente_id: ingId, cantidad }],
      };
    });
  };

  const removeIngrediente = (ingId: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes?.filter((i) => i.ingrediente_id !== ingId),
    }));
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isLoading) return <div>Cargando productos...</div>;
  if (error) return <div>Error al cargar productos</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Productos</h1>

      <button
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
        style={{ marginBottom: '20px', padding: '8px 16px' }}
      >
        + Nuevo Producto
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ccc',
          }}
        >
          <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>

          <div>
            <label>Nombre: </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label>Descripción: </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </div>

          <div>
            <label>Precio (en céntimos): </label>
            <input
              type="number"
              value={formData.price_in_cents}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price_in_cents: Number(e.target.value),
                })
              }
              required
              min={0}
            />
            <small> Ej: 1500 = $15.00</small>
          </div>

          <div>
            <label>Stock inicial: </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: Number(e.target.value) })
              }
              min={0}
            />
          </div>

          <div>
            <label>Activo: </label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
          </div>

          <div>
            <label>Imágenes (URLs, separadas por coma): </label>
            <input
              type="text"
              value={formData.images?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div>
            <h4>Categorías</h4>
            {categorias?.map((cat) => (
              <label key={cat.id} style={{ display: 'block', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  checked={formData.categoria_ids?.includes(cat.id) || false}
                  onChange={() => toggleCategoria(cat.id)}
                />
                {' '}{cat.nombre}
              </label>
            ))}
          </div>

          <div>
            <h4>Ingredientes</h4>
            {ingredientes?.map((ing: any) => {
              const current = formData.ingredientes?.find(
                (i) => i.ingrediente_id === ing.id
              );
              return (
                <div key={ing.id} style={{ margin: '8px 0' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!current}
                      onChange={() => {
                        if (current) {
                          removeIngrediente(ing.id);
                        } else {
                          updateIngrediente(ing.id, 0);
                        }
                      }}
                    />
                    {' '}{ing.nombre} ({ing.unidad_medida})
                  </label>
                  {current && (
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={current.cantidad}
                      onChange={(e) =>
                        updateIngrediente(ing.id, Number(e.target.value))
                      }
                      style={{ marginLeft: '10px', width: '80px' }}
                      min={0}
                      step="0.1"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button type="submit" style={{ marginTop: '10px', marginRight: '10px' }}>
            Guardar
          </button>
          <button type="button" onClick={resetForm}>
            Cancelar
          </button>
        </form>
      )}

      <h2>Lista de Productos</h2>
      <table border={1} cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Activo</th>
            <th>Categorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data?.productos.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.nombre}</td>
              <td>{formatPrice(product.price_in_cents)}</td>
              <td>
                {stockEdit?.id === product.id ? (
                  <span>
                    <input
                      type="number"
                      value={stockEdit.value}
                      onChange={(e) =>
                        setStockEdit({ id: product.id, value: e.target.value })
                      }
                      style={{ width: '60px' }}
                    />
                    <button onClick={() => handleStockAction(product.id, 'set', Number(stockEdit.value))}>
                      Set
                    </button>
                    <button onClick={() => setStockEdit(null)}>X</button>
                  </span>
                ) : (
                  <span>
                    {product.stock}{' '}
                    <button
                      onClick={() =>
                        handleStockAction(product.id, 'increment', 1)
                      }
                    >
                      +1
                    </button>
                    <button
                      onClick={() =>
                        handleStockAction(product.id, 'decrement', 1)
                      }
                    >
                      -1
                    </button>
                    <button
                      onClick={() =>
                        setStockEdit({ id: product.id, value: String(product.stock) })
                      }
                    >
                      Editar
                    </button>
                  </span>
                )}
              </td>
              <td>{product.is_active ? 'Sí' : 'No'}</td>
              <td>
                {product.categoria_ids
                  .map(
                    (catId) =>
                      categorias?.find((c) => c.id === catId)?.nombre || catId
                  )
                  .join(', ')}
              </td>
              <td>
                <button onClick={() => openEdit(product)}>Editar</button>
                <button
                  onClick={() => setDeleteConfirm(product)}
                  style={{ marginLeft: '5px', color: 'red' }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span style={{ margin: '0 10px' }}>Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || page * 20 >= data.total}
        >
          Siguiente
        </button>
      </div>

      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro de eliminar el producto "{deleteConfirm.nombre}"?</p>
            <button onClick={handleDelete} style={{ marginRight: '10px', color: 'red' }}>
              Eliminar
            </button>
            <button onClick={() => setDeleteConfirm(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
