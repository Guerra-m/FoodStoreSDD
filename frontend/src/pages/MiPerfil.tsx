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

  if (profileLoading) return <div style={{ padding: '20px' }}>Cargando perfil...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Mi Perfil</h1>

      {successMsg && (
        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '16px' }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('perfil')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'perfil' ? '3px solid #2196F3' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'perfil' ? 'bold' : 'normal',
          }}
        >
          Datos Personales
        </button>
        <button
          onClick={() => setActiveTab('direcciones')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'direcciones' ? '3px solid #2196F3' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'direcciones' ? 'bold' : 'normal',
          }}
        >
          Direcciones
        </button>
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <div>
          {!isEditing ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Nombre:</strong> {profile?.nombre}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Email:</strong> {profile?.email}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Teléfono:</strong> {profile?.telefono || '—'}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Fecha de Nacimiento:</strong> {profile?.fecha_nacimiento ? profile.fecha_nacimiento.split('T')[0] : '—'}
              </div>
              {profile?.foto_url && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Foto:</strong><br />
                  <img src={profile.foto_url} alt="Foto de perfil" style={{ maxWidth: '150px', borderRadius: '8px' }} />
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Editar Perfil
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Nombre</label>
                <input
                  type="text"
                  value={profileForm.nombre}
                  onChange={e => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Teléfono</label>
                <input
                  type="text"
                  value={profileForm.telefono}
                  onChange={e => setProfileForm({ ...profileForm, telefono: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>URL de Foto</label>
                <input
                  type="text"
                  value={profileForm.foto_url}
                  onChange={e => setProfileForm({ ...profileForm, foto_url: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={profileForm.fecha_nacimiento}
                  onChange={e => setProfileForm({ ...profileForm, fecha_nacimiento: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {updateProfile.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#9e9e9e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
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
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
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
            <p style={{ color: '#666' }}>No tenés direcciones registradas todavía.</p>
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
