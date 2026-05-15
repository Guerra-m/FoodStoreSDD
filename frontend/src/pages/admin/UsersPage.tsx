import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  listUsers,
  updateUserRoles,
  deleteUser,
  restoreUser,
} from '../../api/admin';
import type { UserAdmin } from '../../types/admin';
import { SkeletonTable } from '../../components/SkeletonTable';

const ALL_ROLES = ['Cliente', 'Admin', 'Delivery'];

// ─── Edit Roles Modal ────────────────────────────────────────────────────────

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

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 min-w-[320px] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 mb-4 text-gray-900">Editar Roles: {user.nombre}</h3>

        {ALL_ROLES.map((role) => (
          <label
            key={role}
            className="flex items-center gap-2 py-1.5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(selectedRoles)}
            className="px-4 py-2 border-0 rounded-lg bg-blue-600 text-white cursor-pointer text-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role badge colors ────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Admin: 'bg-blue-100 text-blue-800',
    Delivery: 'bg-yellow-100 text-yellow-800',
    Cliente: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1 ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
}

// ─── Users Row ────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onEditRoles,
  onDelete,
  onRestore,
}: {
  user: UserAdmin;
  onEditRoles: (u: UserAdmin) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
}) {
  const isDeleted = user.eliminado_en !== null;

  return (
    <tr className={`border-b border-gray-100 ${isDeleted ? 'opacity-60' : ''}`}>
      <td className="p-2">{user.nombre}</td>
      <td className="p-2 text-gray-500 text-sm">{user.email}</td>
      <td className="p-2">
        {user.roles.map((role) => (
          <RoleBadge key={role} role={role} />
        ))}
      </td>
      <td className="p-2 text-sm text-gray-500">
        {new Date(user.creado_en).toLocaleDateString('es-AR')}
      </td>
      <td className="p-2">
        {isDeleted ? (
          <button
            onClick={() => onRestore(user.id)}
            className="px-2.5 py-1 border border-emerald-500 rounded-lg bg-emerald-50 text-emerald-800 cursor-pointer text-xs"
          >
            Restaurar
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => onEditRoles(user)}
              className="px-2.5 py-1 border border-gray-300 rounded-lg bg-white cursor-pointer text-xs"
            >
              Roles
            </button>
            <button
              onClick={() => {
                if (window.confirm(`¿Eliminar a "${user.nombre}"?`)) {
                  onDelete(user.id);
                }
              }}
              className="px-2.5 py-1 border border-red-300 rounded-lg bg-red-50 text-red-800 cursor-pointer text-xs"
            >
              Eliminar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Users Page ──────────────────────────────────────────────────────────

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, includeDeleted],
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
    onSuccess: () => {
      toast.success('Roles actualizados');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
    },
    onError: () => toast.error('Error al actualizar roles'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreUser(id),
    onSuccess: () => {
      toast.success('Usuario restaurado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Error al restaurar usuario'),
  });

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div>
      <h2 className="mb-4 text-gray-900 text-xl font-bold">Gestión de Usuarios</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos los roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); }}
          />
          Incluir eliminados
        </label>
      </div>

      {/* Table */}
      {isLoading && <SkeletonTable rows={8} />}
      {error && <div className="text-red-500">Error al cargar usuarios</div>}

      {data && !data.users.length && (
        <div className="text-gray-400 py-8 text-center">No se encontraron usuarios</div>
      )}

      {data && data.users.length > 0 && (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-left">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Roles</th>
                <th className="p-2">Registro</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEditRoles={setEditingUser}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onRestore={(id) => restoreMutation.mutate(id)}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6 items-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm ${
                page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm ${
                page >= totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {editingUser && (
        <EditRolesModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (roles) => {
            await updateRolesMutation.mutateAsync({ id: editingUser.id, roles });
          }}
        />
      )}
    </div>
  );
}
