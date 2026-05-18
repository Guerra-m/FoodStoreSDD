import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getUserAddresses,
  createUserAddress,
  deleteUserAddress,
  setUserAddressPrincipal,
} from '../../api/admin';
import type { DireccionCreate } from '../../api/address';
import type { UserAdmin } from '../../types/admin';
import { Button } from '../ui/Button';

function AddressForm({
  onSave,
  onCancel,
}: {
  onSave: (data: DireccionCreate) => void;
  onCancel: () => void;
}) {
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ calle, numero, ciudad, provincia, codigo_postal: codigoPostal });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-0.5">Calle</label>
        <input
          type="text" required
          value={calle}
          onChange={(e) => setCalle(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-0.5">Número</label>
          <input
            type="text" required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-0.5">Código Postal</label>
          <input
            type="text" required
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-0.5">Ciudad</label>
          <input
            type="text" required
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-0.5">Provincia</label>
          <input
            type="text" required
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" type="submit">
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function AdminAddressModal({
  user,
  onClose,
}: {
  user: UserAdmin;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const queryKey = ['admin', 'users', user.id, 'direcciones'];

  const { data: addresses, isLoading } = useQuery({
    queryKey,
    queryFn: () => getUserAddresses(user.id),
  });

  const createMutation = useMutation({
    mutationFn: (data: DireccionCreate) => createUserAddress(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Dirección creada correctamente');
      setShowForm(false);
    },
    onError: () => toast.error('Error al crear dirección'),
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: number) => deleteUserAddress(user.id, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Dirección eliminada correctamente');
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : 'Error al eliminar dirección';
      toast.error(msg);
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: (addressId: number) => setUserAddressPrincipal(user.id, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Dirección principal actualizada');
    },
    onError: () => toast.error('Error al actualizar dirección principal'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 id="address-modal-title" className="text-lg font-semibold text-gray-900">
            Direcciones — {user.nombre}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar" className="p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {isLoading && (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando direcciones...</div>
          )}

          {!isLoading && addresses && addresses.length === 0 && (
            <div className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-300 rounded-lg">
              Este usuario no tiene direcciones registradas.
            </div>
          )}

          {!isLoading && addresses && addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex items-start justify-between p-3 rounded-lg border text-sm ${
                    addr.es_principal
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {addr.calle} {addr.numero}
                      </span>
                      {addr.es_principal && (
                        <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {addr.ciudad}, {addr.provincia} — CP: {addr.codigo_postal}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    {!addr.es_principal && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setPrincipalMutation.mutate(addr.id)}
                        disabled={setPrincipalMutation.isPending}
                        title="Marcar como principal"
                      >
                        ★
                      </Button>
                    )}
                    <Button
                      variant="danger" size="sm"
                      onClick={() => {
                        if (window.confirm('¿Eliminar esta dirección?')) {
                          deleteMutation.mutate(addr.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Nueva Dirección</h4>
              <AddressForm
                onSave={(data) => createMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Nueva Dirección
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
