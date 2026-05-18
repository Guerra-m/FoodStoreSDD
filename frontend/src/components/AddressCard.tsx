import type { Direccion } from '../api/address';
import { Button } from './ui/Button';

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
            <Button
              variant="ghost" size="sm"
              onClick={() => onSetPrincipal(direccion.id)}
            >
              Principal
            </Button>
          )}
          <Button
            variant="ghost" size="sm"
            onClick={() => onEdit(direccion)}
          >
            Editar
          </Button>
          <Button
            variant="danger" size="sm"
            onClick={() => onDelete(direccion.id)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
