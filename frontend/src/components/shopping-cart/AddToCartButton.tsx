import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { toast } from 'react-toastify';

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
      <button
        onClick={handleOpen}
        style={{
          padding: '10px 20px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Agregar al carrito
      </button>

      {/* Modal de exclusión de ingredientes */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 1100,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              zIndex: 1101,
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>Personalizar {nombre}</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Desmarcá los ingredientes que querés excluir:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ingredientes.map((ing) => (
                <label
                  key={ing.ingredienteId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    padding: '4px 0',
                  }}
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
