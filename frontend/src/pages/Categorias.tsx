import { useState } from 'react';
import {
  useCategories,
  useCategoriaTree,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '../hooks/useCategories';
import { Categoria, CategoriaTree, CategoriaCreate, CategoriaUpdate } from '../api/categories';

export default function Categorias() {
  const { data: categorias, isLoading, error } = useCategories();
  const { data: categoriaTree } = useCategoriaTree();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();

  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<CategoriaCreate>({ nombre: '', padre_id: null });
  const [deleteConfirm, setDeleteConfirm] = useState<Categoria | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoria) {
        await updateMutation.mutateAsync({
          id: editingCategoria.id,
          data: { nombre: formData.nombre, padre_id: formData.padre_id },
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setShowForm(false);
      setEditingCategoria(null);
      setFormData({ nombre: '', padre_id: null });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar categoría');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar categoría');
    }
  };

  const openEdit = (cat: Categoria) => {
    setEditingCategoria(cat);
    setFormData({ nombre: cat.nombre, padre_id: cat.padre_id });
    setShowForm(true);
  };

  if (isLoading) return <div>Cargando categorías...</div>;
  if (error) return <div>Error al cargar categorías</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Categorías</h1>

      <button
        onClick={() => {
          setShowForm(true);
          setEditingCategoria(null);
          setFormData({ nombre: '', padre_id: null });
        }}
        style={{ marginBottom: '20px', padding: '8px 16px' }}
      >
        + Nueva Categoría
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <h3>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <div>
            <label>Nombre: </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Categoría Padre: </label>
            <select
              value={formData.padre_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, padre_id: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">-- Ninguna (Raíz) --</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ marginTop: '10px', marginRight: '10px' }}>
            Guardar
          </button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      )}

      <h2>Lista de Categorías</h2>
      <table border={1} cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Padre</th>
            <th>Posición</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias?.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.nombre}</td>
              <td>{cat.padre_id ? categorias.find((c) => c.id === cat.padre_id)?.nombre || cat.padre_id : '-'}</td>
              <td>{cat.posicion}</td>
              <td>
                <button onClick={() => openEdit(cat)}>Editar</button>
                <button
                  onClick={() => setDeleteConfirm(cat)}
                  style={{ marginLeft: '5px', color: 'red' }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Árbol de Categorías</h2>
      <div style={{ marginTop: '20px' }}>
        {categoriaTree && categoriaTree.length > 0 ? (
          <TreeView tree={categoriaTree} />
        ) : (
          <p>No hay categorías</p>
        )}
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
            <p>¿Está seguro de eliminar la categoría "{deleteConfirm.nombre}"?</p>
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

function TreeView({ tree, level = 0 }: { tree: CategoriaTree[]; level?: number }) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: level > 0 ? '20px' : '0' }}>
      {tree.map((node) => (
        <li key={node.id} style={{ margin: '5px 0' }}>
          <span style={{ fontWeight: node.hijos.length > 0 ? 'bold' : 'normal' }}>
            {node.nombre} {node.hijos.length > 0 && `(${node.hijos.length})`}
          </span>
          {node.hijos.length > 0 && <TreeView tree={node.hijos} level={level + 1} />}
        </li>
      ))}
    </ul>
  );
}