import type { Direccion } from '../api/address';

interface AddressCardProps {
  direccion: Direccion;
  onEdit: (direccion: Direccion) => void;
  onDelete: (id: number) => void;
  onSetPrincipal: (id: number) => void;
}

export default function AddressCard({ direccion, onEdit, onDelete, onSetPrincipal }: AddressCardProps) {
  return (
    <div className={`rounded-lg p-4 mb-3 ${direccion.es_principal ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-300 bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <strong>{direccion.calle} {direccion.numero}</strong>
          {direccion.es_principal && (
            <span className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded text-xs">
              Principal
            </span>
          )}
          <p className="my-1 text-gray-600">
            {direccion.ciudad}, {direccion.provincia} - CP: {direccion.codigo_postal}
          </p>
        </div>
        <div className="flex gap-2">
          {!direccion.es_principal && (
            <button
              onClick={() => onSetPrincipal(direccion.id)}
              className="px-3 py-1 bg-blue-500 text-white border-0 rounded cursor-pointer"
            >
              Principal
            </button>
          )}
          <button
            onClick={() => onEdit(direccion)}
            className="px-3 py-1 bg-yellow-500 text-black border-0 rounded cursor-pointer"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(direccion.id)}
            className="px-3 py-1 bg-red-500 text-white border-0 rounded cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
