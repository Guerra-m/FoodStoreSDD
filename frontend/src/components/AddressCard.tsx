import type { Direccion } from '../api/address';

interface AddressCardProps {
  direccion: Direccion;
  onEdit: (direccion: Direccion) => void;
  onDelete: (id: number) => void;
  onSetPrincipal: (id: number) => void;
}

export default function AddressCard({ direccion, onEdit, onDelete, onSetPrincipal }: AddressCardProps) {
  return (
    <div style={{
      border: direccion.es_principal ? '2px solid #4CAF50' : '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: direccion.es_principal ? '#f0fff0' : '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong>{direccion.calle} {direccion.numero}</strong>
          {direccion.es_principal && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              Principal
            </span>
          )}
          <p style={{ margin: '4px 0', color: '#666' }}>
            {direccion.ciudad}, {direccion.provincia} - CP: {direccion.codigo_postal}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!direccion.es_principal && (
            <button
              onClick={() => onSetPrincipal(direccion.id)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Principal
            </button>
          )}
          <button
            onClick={() => onEdit(direccion)}
            style={{
              padding: '4px 12px',
              backgroundColor: '#FFC107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(direccion.id)}
            style={{
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
