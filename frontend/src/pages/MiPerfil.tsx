import { useState } from 'react';
import { useCustomerProfile, useUpdateProfile } from '../hooks/useCustomerProfile';
import { useDirecciones, useCreateDireccion, useUpdateDireccion, useDeleteDireccion, useSetDireccionPrincipal } from '../hooks/useDirecciones';
import AddressCard from '../components/AddressCard';
import AddressFormModal from '../components/AddressFormModal';
import type { Direccion, DireccionCreate, DireccionUpdate } from '../api/address';

type Tab = 'perfil' | 'direcciones';

export default function MiPerfil() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [editingAddress, setEditingAddress] = useState<Direccion | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const updateProfile = useUpdateProfile();

  const { data: direcciones, isLoading: addressesLoading } = useDirecciones();
  const createDireccion = useCreateDireccion();
  const updateDireccion = useUpdateDireccion();
  const deleteDireccion = useDeleteDireccion();
  const setPrincipal = useSetDireccionPrincipal();

  const [profileForm, setProfileForm] = useState({
    nombre: '',
    telefono: '',
    foto_url: '',
    fecha_nacimiento: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize form when profile loads
  if (profile && !isEditing && profileForm.nombre === '') {
    setProfileForm({
      nombre: profile.nombre || '',
      telefono: profile.telefono || '',
      foto_url: profile.foto_url || '',
      fecha_nacimiento: profile.fecha_nacimiento ? profile.fecha_nacimiento.split('T')[0] : '',
    });
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        nombre: profileForm.nombre || undefined,
        telefono: profileForm.telefono || null,
        foto_url: profileForm.foto_url || null,
        fecha_nacimiento: profileForm.fecha_nacimiento || null,
      });
      setIsEditing(false);
      setSuccessMsg('Perfil actualizado correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // error handled by hook
    }
  };

  const handleAddressSave = async (data: DireccionCreate | DireccionUpdate) => {
    try {
      if (editingAddress) {
        await updateDireccion.mutateAsync({ id: editingAddress.id, data });
      } else {
        await createDireccion.mutateAsync(data as DireccionCreate);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch {
      // error handled by hook
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta dirección?')) {
      try {
        await deleteDireccion.mutateAsync(id);
      } catch {
        // error handled by hook
      }
    }
  };

  if (profileLoading) return <div className="p-5">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1>Mi Perfil</h1>

      {successMsg && (
        <div className="p-3 bg-green-100 text-green-800 rounded mb-4">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b-2 border-gray-300">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-5 py-3 border-none bg-transparent cursor-pointer ${
            activeTab === 'perfil' ? 'border-b-[3px] border-blue-500 font-bold' : 'border-b-[3px] border-transparent font-normal'
          }`}
        >
          Datos Personales
        </button>
        <button
          onClick={() => setActiveTab('direcciones')}
          className={`px-5 py-3 border-none bg-transparent cursor-pointer ${
            activeTab === 'direcciones' ? 'border-b-[3px] border-blue-500 font-bold' : 'border-b-[3px] border-transparent font-normal'
          }`}
        >
          Direcciones
        </button>
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <div>
          {!isEditing ? (
            <div>
              <div className="mb-4">
                <strong>Nombre:</strong> {profile?.nombre}
              </div>
              <div className="mb-4">
                <strong>Email:</strong> {profile?.email}
              </div>
              <div className="mb-4">
                <strong>Teléfono:</strong> {profile?.telefono || '—'}
              </div>
              <div className="mb-4">
                <strong>Fecha de Nacimiento:</strong> {profile?.fecha_nacimiento ? profile.fecha_nacimiento.split('T')[0] : '—'}
              </div>
              {profile?.foto_url && (
                <div className="mb-4">
                  <strong>Foto:</strong><br />
                  <img src={profile.foto_url} alt="Foto de perfil" className="max-w-[150px] rounded-lg" />
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-3 bg-blue-500 text-white border-none rounded cursor-pointer"
              >
                Editar Perfil
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-3">
                <label className="block mb-1 font-bold">Nombre</label>
                <input
                  type="text"
                  value={profileForm.nombre}
                  onChange={e => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-bold">Teléfono</label>
                <input
                  type="text"
                  value={profileForm.telefono}
                  onChange={e => setProfileForm({ ...profileForm, telefono: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-bold">URL de Foto</label>
                <input
                  type="text"
                  value={profileForm.foto_url}
                  onChange={e => setProfileForm({ ...profileForm, foto_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-bold">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={profileForm.fecha_nacimiento}
                  onChange={e => setProfileForm({ ...profileForm, fecha_nacimiento: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="px-5 py-3 bg-green-500 text-white border-none rounded cursor-pointer"
                >
                  {updateProfile.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 bg-gray-400 text-white border-none rounded cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Direcciones Tab */}
      {activeTab === 'direcciones' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
              className="px-5 py-3 bg-green-500 text-white border-none rounded cursor-pointer"
            >
              + Nueva Dirección
            </button>
          </div>

          {addressesLoading ? (
            <div>Cargando direcciones...</div>
          ) : direcciones && direcciones.length > 0 ? (
            direcciones.map(dir => (
              <AddressCard
                key={dir.id}
                direccion={dir}
                onEdit={(d) => { setEditingAddress(d); setShowAddressForm(true); }}
                onDelete={handleDelete}
                onSetPrincipal={setPrincipal.mutate}
              />
            ))
          ) : (
            <p className="text-gray-500">No tenés direcciones registradas todavía.</p>
          )}

          {showAddressForm && (
            <AddressFormModal
              direccion={editingAddress}
              onClose={() => { setShowAddressForm(false); setEditingAddress(null); }}
              onSave={handleAddressSave}
            />
          )}
        </div>
      )}
    </div>
  );
}
