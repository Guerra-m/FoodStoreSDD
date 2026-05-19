import { useState } from 'react';
import type { Direccion, DireccionCreate, DireccionUpdate } from '../api/address';
import { Button } from './ui/Button';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white p-6 rounded-lg w-[400px] max-w-[90%]">
        <h3 className="mt-0">
          {direccion ? 'Editar Dirección' : 'Nueva Dirección'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 font-bold">Calle</label>
            <input
              type="text"
              value={formData.calle}
              onChange={e => setFormData({ ...formData, calle: e.target.value })}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-bold">Número</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.numero}
              onChange={e => setFormData({ ...formData, numero: e.target.value.replace(/\D/g, '') })}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-bold">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-bold">Provincia</label>
            <input
              type="text"
              value={formData.provincia}
              onChange={e => setFormData({ ...formData, provincia: e.target.value })}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-bold">Código Postal</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.codigo_postal}
              onChange={e => setFormData({ ...formData, codigo_postal: e.target.value.replace(/\D/g, '') })}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary" size="md"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
