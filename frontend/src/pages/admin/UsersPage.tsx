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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', minWidth: '320px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 1rem', color: '#111827' }}>Editar Roles: {user.nombre}</h3>

        {ALL_ROLES.map((role) => (
          <label
            key={role}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px',
              background: '#fff', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(selectedRoles)}
            style={{
              padding: '0.5rem 1rem', border: 'none', borderRadius: '6px',
              background: '#2563eb', color: '#fff', cursor: 'pointer',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Table ─────────────────────────────────────────────────────────────

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
    <tr style={{ borderBottom: '1px solid #f3f4f6', opacity: isDeleted ? 0.6 : 1 }}>
      <td style={{ padding: '0.6rem' }}>{user.nombre}</td>
      <td style={{ padding: '0.6rem', color: '#6b7280', fontSize: '0.9rem' }}>{user.email}</td>
      <td style={{ padding: '0.6rem' }}>
        {user.roles.map((role) => (
          <span
            key={role}
            style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
              fontSize: '0.75rem', fontWeight: 600, marginRight: '4px',
              background: role === 'Admin' ? '#dbeafe' : role === 'Delivery' ? '#fef3c7' : '#e0f2fe',
              color: role === 'Admin' ? '#1e40af' : role === 'Delivery' ? '#92400e' : '#0369a1',
            }}
          >
            {role}
          </span>
        ))}
      </td>
      <td style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>
        {new Date(user.creado_en).toLocaleDateString('es-AR')}
      </td>
      <td style={{ padding: '0.6rem' }}>
        {isDeleted ? (
          <button
            onClick={() => onRestore(user.id)}
            style={{
              padding: '4px 10px', border: '1px solid #10b981', borderRadius: '6px',
              background: '#ecfdf5', color: '#065f46', cursor: 'pointer', fontSize: '0.8rem',
            }}
          >
            Restaurar
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => onEditRoles(user)}
              style={{
                padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
                background: '#fff', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              Roles
            </button>
            <button
              onClick={() => {
                if (window.confirm(`¿Eliminar a "${user.nombre}"?`)) {
                  onDelete(user.id);
                }
              }}
              style={{
                padding: '4px 10px', border: '1px solid #fca5a5', borderRadius: '6px',
                background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              Eliminar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Users Page ─────────────────────────────────────────────────────────

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
      <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Gestión de Usuarios</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px',
            flex: 1, minWidth: '200px', fontSize: '0.9rem',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
        >
          <option value="">Todos los roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}>
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
      {error && <div style={{ color: '#ef4444' }}>Error al cargar usuarios</div>}

      {data && !data.users.length && (
        <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>No se encontraron usuarios</div>
      )}

      {data && data.users.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>Nombre</th>
                <th style={{ padding: '0.6rem' }}>Email</th>
                <th style={{ padding: '0.6rem' }}>Roles</th>
                <th style={{ padding: '0.6rem' }}>Registro</th>
                <th style={{ padding: '0.6rem' }}>Acciones</th>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px',
                background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
              }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px',
                background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
              }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Edit Roles Modal */}
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
