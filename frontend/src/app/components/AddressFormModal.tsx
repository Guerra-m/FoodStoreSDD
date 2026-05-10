import { useState } from 'react';
import type { Direccion, DireccionCreate, DireccionUpdate } from '../../shared/api/addressApi';

interface AddressFormModalProps {
  direccion?: Direccion | null;
  onClose: () => void;
  onSave: (data: DireccionCreate | DireccionUpdate) => void;
}

export default function AddressFormModal({ direccion, onClose, onSave }: AddressFormModalProps) {
  const [formData, setFormData] = useState({
    calle: direccion?.calle || '',
    numero: direccion?.numero || '',
    ciudad: direccion?.ciudad || '',
    provincia: direccion?.provincia || '',
    codigo_postal: direccion?.codigo_postal || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
      }}>
        <h3 style={{ marginTop: 0 }}>
          {direccion ? 'Editar Dirección' : 'Nueva Dirección'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Calle</label>
            <input
              type="text"
              value={formData.calle}
              onChange={e => setFormData({ ...formData, calle: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={e => setFormData({ ...formData, numero: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Provincia</label>
            <input
              type="text"
              value={formData.provincia}
              onChange={e => setFormData({ ...formData, provincia: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Código Postal</label>
            <input
              type="text"
              value={formData.codigo_postal}
              onChange={e => setFormData({ ...formData, codigo_postal: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
