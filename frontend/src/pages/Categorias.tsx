import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  useCategories,
  useCategoriaTree,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '../hooks/useCategories';
import { Categoria, CategoriaTree, CategoriaCreate, CategoriaUpdate } from '../api/categories';

/* CategoriaBasic basta para el form (no necesita product_count / hijos) */
type CategoriaBasic = Pick<Categoria, 'id' | 'nombre' | 'padre_id' | 'posicion'>;
import { SkeletonTable } from '../components/SkeletonTable';
import { Button } from '../components/ui/Button';

/* ─── Initial form data ───────────────────────────────────────────────── */

const INITIAL_FORM: CategoriaCreate = { nombre: '', padre_id: null };

/* ─── Component ───────────────────────────────────────────────────────── */

export default function Categorias() {
  const { data: categorias, isLoading, error } = useCategories();
  const { data: categoriaTree } = useCategoriaTree();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();

  /* Form / modal state */
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaBasic | null>(null);
  const [formData, setFormData] = useState<CategoriaCreate>(INITIAL_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<CategoriaBasic | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setEditingCategoria(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setFormData(INITIAL_FORM);
    setEditingCategoria(null);
    setShowForm(true);
  };

  const openEdit = (cat: CategoriaBasic) => {
    setEditingCategoria(cat);
    setFormData({ nombre: cat.nombre, padre_id: cat.padre_id });
    setShowForm(true);
  };

  const openAddSub = (parent: CategoriaBasic) => {
    setFormData({ nombre: '', padre_id: parent.id });
    setEditingCategoria(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategoria) {
        const updated = await updateMutation.mutateAsync({
          id: editingCategoria.id,
          data: { nombre: formData.nombre, padre_id: formData.padre_id },
        });

        // Actualiza la cache DIRECTAMENTE para que la tabla se refresque al instante
        const listKey: unknown[] = ['categorias'];
        const currentList = queryClient.getQueryData<Categoria[]>(listKey);
        if (currentList) {
          queryClient.setQueryData<Categoria[]>(listKey, [
            ...currentList.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          ]);
        }

        toast.success('Categoría actualizada correctamente');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Categoría creada correctamente');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al guardar categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success('Categoría eliminada correctamente');
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar categoría');
    }
  };

  /* ── Parent name resolver ──────────────────────────────────────── */

  const getParentName = (padreId: number | null): string => {
    if (!padreId) return '-';
    return categorias?.find((c) => c.id === padreId)?.nombre || String(padreId);
  };

  /* ── Tree flatten helpers ──────────────────────────────────────── */

  /** Aplana el árbol en una lista plana con profundidad para mostrar indentación */
  const flattenTree = (
    nodes: CategoriaTree[],
    depth = 0,
  ): { id: number; nombre: string; depth: number }[] => {
    const result: { id: number; nombre: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, nombre: node.nombre, depth });
      if (node.hijos.length > 0) result.push(...flattenTree(node.hijos, depth + 1));
    }
    return result;
  };

  /** Recolecta el ID de un nodo + todos sus descendientes (para excluirlos al editar) */
  const collectSubtreeIds = (nodes: CategoriaTree[], targetId: number): number[] => {
    for (const node of nodes) {
      if (node.id === targetId) return [node.id, ...collectAllChildrenIds(node.hijos)];
      if (node.hijos.length > 0) {
        const found = collectSubtreeIds(node.hijos, targetId);
        if (found.length > 0) return found;
      }
    }
    return [];
  };

  const collectAllChildrenIds = (nodes: CategoriaTree[]): number[] =>
    nodes.flatMap((n) => [n.id, ...collectAllChildrenIds(n.hijos)]);

  /** IDs a excluir del selector de padre (al editar: la categoría misma + sus hijas) */
  const excludedParentIds = editingCategoria
    ? new Set(collectSubtreeIds(categoriaTree ?? [], editingCategoria.id))
    : new Set<number>();

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-bold">Gestión de Categorías</h2>
        <Button onClick={openCreate}>
          + Nueva Categoría
        </Button>
      </div>

      {/* ── Loading state ──────────────────────────────────────────── */}
      {isLoading && (
        <div aria-busy="true" aria-label="Cargando categorías">
          <SkeletonTable rows={6} />
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 text-sm mb-6">
          Error al cargar categorías. Intente nuevamente.
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && !error && categorias && categorias.length === 0 && (
        <div className="text-gray-400 py-12 text-center border border-dashed border-gray-300 rounded-lg mb-6">
          <p className="text-base mb-2">No hay categorías todavía</p>
          <Button onClick={openCreate}>
            + Crear primera categoría
          </Button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      {!isLoading && !error && categorias && categorias.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
                <th className="p-3 font-semibold w-[60px]">ID</th>
                <th className="p-3 font-semibold">Nombre</th>
                <th className="p-3 font-semibold w-[180px]">Categoría Padre</th>
                <th className="p-3 font-semibold w-[100px]">Posición</th>
                <th className="p-3 font-semibold w-[130px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-500">#{cat.id}</td>
                  <td className="p-3 font-medium text-gray-900">{cat.nombre}</td>
                  <td className="p-3 text-gray-600">{getParentName(cat.padre_id)}</td>
                  <td className="p-3 text-gray-600">{cat.posicion}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => openEdit(cat)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger" size="sm"
                        onClick={() => setDeleteConfirm(cat)}
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
      )}

      {/* ── Tree View ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 text-base font-semibold mb-4">Árbol de Categorías</h3>
        {categoriaTree && categoriaTree.length > 0 ? (
          <TreeView
            tree={categoriaTree}
            onEdit={(cat) => openEdit(cat)}
            onAddSub={(cat) => openAddSub(cat)}
            onDelete={(cat) => setDeleteConfirm(cat)}
          />
        ) : (
          <p className="text-sm text-gray-400">No hay categorías disponibles</p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar Categoría
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
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="categoria-modal-title"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="categoria-modal-title" className="text-lg font-semibold text-gray-900">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
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
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
              {/* Nombre */}
              <div>
                <label htmlFor="cat-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  id="cat-nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre de la categoría"
                />
              </div>

              {/* Categoría Padre */}
              <div>
                <label htmlFor="cat-padre" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría Padre
                </label>
                <select
                  id="cat-padre"
                  value={formData.padre_id ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      padre_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">-- Ninguna (Raíz) --</option>
                  {flattenTree(categoriaTree ?? []).map((item) => {
                    const disabled = excludedParentIds.has(item.id);
                    return (
                      <option key={item.id} value={item.id} disabled={disabled}>
                        {'\u00A0\u00A0\u00A0\u00A0'.repeat(item.depth)}
                        {'\u2514\u00A0'}
                        {item.nombre}
                      </option>
                    );
                  })}
                </select>
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
                  {editingCategoria ? 'Guardar cambios' : 'Crear categoría'}
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

/* ═══════════════════════════════════════════════════════════════════════════
   TreeView: renderiza jerarquía de categorías con acciones
   ═══════════════════════════════════════════════════════════════════════════ */

function TreeView({
  tree,
  level = 0,
  onEdit,
  onAddSub,
  onDelete,
}: {
  tree: CategoriaTree[];
  level?: number;
  onEdit: (cat: CategoriaTree) => void;
  onAddSub: (cat: CategoriaTree) => void;
  onDelete: (cat: CategoriaTree) => void;
}) {
  return (
    <ul className={`space-y-0.5 ${level > 0 ? 'ml-5 border-l-2 border-gray-100 pl-4' : 'pl-0'}`}>
      {tree.map((node) => {
        const hasChildren = node.hijos.length > 0;
        return (
          <li key={node.id}>
            <div className="flex items-center gap-2 py-1.5 group">
              <span
                className={`${
                  hasChildren
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-600'
                } text-sm flex-1`}
              >
                {node.nombre}
              </span>
              {hasChildren && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
                  {node.hijos.length}
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onAddSub(node)}
                  className="px-2 py-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded border-0 cursor-pointer transition-colors"
                  title="Agregar subcategoría"
                >
                  + Sub
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(node)}
                  className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border-0 cursor-pointer transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(node)}
                  className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border-0 cursor-pointer transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
            {hasChildren && (
              <TreeView tree={node.hijos} level={level + 1} onEdit={onEdit} onAddSub={onAddSub} onDelete={onDelete} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
