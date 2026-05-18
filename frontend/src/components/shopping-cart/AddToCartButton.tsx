import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';

export interface IngredientOption {
  ingredienteId: number;
  nombre: string;
}

interface AddToCartButtonProps {
  productoId: number;
  nombre: string;
  priceInCents: number;
  ingredientes: IngredientOption[];
}

export default function AddToCartButton({
  productoId,
  nombre,
  priceInCents,
  ingredientes,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [showModal, setShowModal] = useState(false);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);

  const handleToggleIngredient = (ingredienteId: number) => {
    setExcludedIds((prev) =>
      prev.includes(ingredienteId)
        ? prev.filter((id) => id !== ingredienteId)
        : [...prev, ingredienteId],
    );
  };

  const handleAdd = () => {
    addItem({
      productoId,
      nombre,
      priceInCents,
      cantidad: 1,
      excludedIngredientIds: excludedIds,
    });
    toast.success(`${nombre} agregado al carrito`);
    setShowModal(false);
    setExcludedIds([]);
  };

  const handleOpen = () => {
    if (ingredientes.length === 0) {
      // Sin ingredientes, agregar directo
      addItem({ productoId, nombre, priceInCents, cantidad: 1 });
      toast.success(`${nombre} agregado al carrito`);
      return;
    }
    setExcludedIds([]);
    setShowModal(true);
  };

  return (
    <>
      <Button onClick={handleOpen}>
        Agregar al carrito
      </Button>

      {/* Modal de exclusión de ingredientes */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/40 z-[1100]"
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 z-[1101] w-[90%] max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <h3 className="m-0 mb-2">Personalizar {nombre}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Desmarcá los ingredientes que querés excluir:
            </p>

            <div className="flex flex-col gap-2">
              {ingredientes.map((ing) => (
                <label
                  key={ing.ingredienteId}
                  className="flex items-center gap-2 cursor-pointer text-[15px] py-1"
                >
                  <input
                    type="checkbox"
                    checked={!excludedIds.includes(ing.ingredienteId)}
                    onChange={() => handleToggleIngredient(ing.ingredienteId)}
                  />
                  {ing.nombre}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <Button
                variant="secondary" size="sm"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
              >
                Agregar al carrito
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
