import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  listUsers,
  updateUserRoles,
  deleteUser,
  restoreUser,
} from '../../api/admin';
import type { UserAdmin, UserAdminListResponse } from '../../types/admin';
import { SkeletonTable } from '../../components/SkeletonTable';
import { Button } from '../../components/ui/Button';
import { AdminAddressModal } from '../../components/admin/AdminAddressModal';

const ALL_ROLES = ['Cliente', 'Admin', 'Delivery'];

/* ─── Edit Roles Modal ──────────────────────────────────────────────────── */

function EditRolesModal({
  user,
  onClose,
  onSave,
}: {
  user: UserAdmin;
  onClose: () => void;
  onSave: (roles: string[]) => Promise<void>;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...user.roles]);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  /* Close on Escape key */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedRoles);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roles-modal-title"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 id="roles-modal-title" className="text-lg font-semibold text-gray-900">
            Editar Roles: {user.nombre}
          </h3>
          <Button
            variant="ghost" size="sm"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-3">Seleccioná los roles del usuario:</p>
          <div className="space-y-2">
            {ALL_ROLES.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="secondary" size="md"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Role badge colors ──────────────────────────────────────────────────── */

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-blue-100 text-blue-800',
  Delivery: 'bg-yellow-100 text-yellow-800',
  Cliente: 'bg-sky-100 text-sky-700',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1 ${
        ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {role}
    </span>
  );
}

/* ─── Users Row ──────────────────────────────────────────────────────────────── */

function UserRow({
  user,
  onEditRoles,
  onDelete,
  onRestore,
  onManageAddresses,
}: {
  user: UserAdmin;
  onEditRoles: (u: UserAdmin) => void;
  onDelete: (u: UserAdmin) => void;
  onRestore: (id: number) => void;
  onManageAddresses: (u: UserAdmin) => void;
}) {
  const isDeleted = user.eliminado_en !== null;

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isDeleted ? 'opacity-60' : ''}`}>
      <td className="p-3 font-medium text-gray-900">{user.nombre}</td>
      <td className="p-3 text-gray-500 text-sm">{user.email}</td>
      <td className="p-3">
        {user.roles.length > 0 ? (
          user.roles.map((role) => <RoleBadge key={role} role={role} />)
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="p-3 text-sm text-gray-500">
        {new Date(user.creado_en).toLocaleDateString('es-AR')}
      </td>
      <td className="p-3">
        {isDeleted ? (
          <Button
            variant="secondary" size="sm"
            onClick={() => onRestore(user.id)}
          >
            Restaurar
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm"
              onClick={() => onEditRoles(user)}
            >
              Roles
            </Button>
            <Button
              variant="secondary" size="sm"
              onClick={() => onManageAddresses(user)}
            >
              Direcciones
            </Button>
            <Button
              variant="danger" size="sm"
              onClick={() => onDelete(user)}
            >
              Eliminar
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ─── Main Users Page ────────────────────────────────────────────────────────── */

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserAdmin | null>(null);
  const [addressUser, setAddressUser] = useState<UserAdmin | null>(null);

  const queryKey: unknown[] = ['admin', 'users', page, search, roleFilter, includeDeleted];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      listUsers({
        page,
        per_page: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        include_deleted: includeDeleted,
      }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      updateUserRoles(id, { roles }),
    onSuccess: (updated, { id }) => {
      // Direct cache update so UI refreshes instantly
      const currentList = queryClient.getQueryData<UserAdminListResponse>(queryKey);
      if (currentList) {
        queryClient.setQueryData<UserAdminListResponse>(queryKey, {
          ...currentList,
          users: currentList.users.map((u) => (u.id === id ? { ...u, roles: updated.roles } : u)),
        });
      }
      toast.success('Roles actualizados correctamente');
      setEditingUser(null);
    },
    onError: () => toast.error('Error al actualizar roles'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (_, id) => {
      // Direct cache update
      const currentList = queryClient.getQueryData<UserAdminListResponse>(queryKey);
      if (currentList) {
        queryClient.setQueryData<UserAdminListResponse>(queryKey, {
          ...currentList,
          users: currentList.users.filter((u) => u.id !== id),
          total: currentList.total - 1,
        });
      }
      toast.success('Usuario eliminado correctamente');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreUser(id),
    onSuccess: (updated) => {
      // Direct cache update
      const currentList = queryClient.getQueryData<UserAdminListResponse>(queryKey);
      if (currentList) {
        queryClient.setQueryData<UserAdminListResponse>(queryKey, {
          ...currentList,
          users: currentList.users.map((u) =>
            u.id === updated.id ? { ...u, eliminado_en: null } : u,
          ),
        });
      }
      toast.success('Usuario restaurado correctamente');
    },
    onError: () => toast.error('Error al restaurar usuario'),
  });

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteMutation.mutateAsync(deleteConfirm.id);
  };

  return (
    <div>
      {/* Page header */}
      <h2 className="mb-4 text-gray-900 text-xl font-bold">Gestión de Usuarios</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Todos los roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); }}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Incluir eliminados</span>
        </label>
      </div>

      {/* ── Loading state ──────────────────────────────────────────── */}
      {isLoading && (
        <div aria-busy="true" aria-label="Cargando usuarios">
          <SkeletonTable rows={8} />
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          Error al cargar usuarios. Intente nuevamente.
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && !error && data && !data.users.length && (
        <div className="text-gray-400 py-12 text-center border border-dashed border-gray-300 rounded-lg">
          <p className="text-base">No se encontraron usuarios</p>
          {search && (
            <p className="text-sm mt-1">Probá con otros términos de búsqueda</p>
          )}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      {!isLoading && !error && data && data.users.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
                  <th className="p-3 font-semibold">Nombre</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Roles</th>
                  <th className="p-3 font-semibold">Registro</th>
                  <th className="p-3 font-semibold w-[220px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEditRoles={setEditingUser}
                    onDelete={setDeleteConfirm}
                    onRestore={(id) => restoreMutation.mutate(id)}
                    onManageAddresses={setAddressUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-3 mt-6">
            <Button
              variant="secondary" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> — {data.total} usuarios
            </span>
            <Button
              variant="secondary" size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Editar Roles
          ═══════════════════════════════════════════════════════════════════ */}
      {editingUser && (
        <EditRolesModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (roles) => {
            await updateRolesMutation.mutateAsync({ id: editingUser.id, roles });
          }}
        />
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
            aria-labelledby="delete-user-modal-title"
          >
            <h3 id="delete-user-modal-title" className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de eliminar a <strong>"{deleteConfirm.nombre}"</strong>?
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
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                loading={deleteMutation.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Administrar Direcciones
          ═══════════════════════════════════════════════════════════════════ */}
      {addressUser && (
        <AdminAddressModal
          user={addressUser}
          onClose={() => setAddressUser(null)}
        />
      )}
    </div>
  );
}
