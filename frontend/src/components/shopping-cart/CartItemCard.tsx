import type { CartItem } from '../../types/shopping-cart';
import { selectItemSubtotal } from '../../stores/cartStore';

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, cantidad: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-200 items-start">
      {/* Info */}
      <div className="flex-1">
        <div className="font-semibold mb-1">{item.nombre}</div>
        <div className="text-sm text-gray-600">
          {formatPrice(item.priceInCents)} c/u
        </div>

        {/* Ingredientes excluidos */}
        {item.excludedIngredientIds.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            Sin ingredientes ID: {item.excludedIngredientIds.join(', ')}
          </div>
        )}

        <div className="text-sm font-medium mt-1">
          Subtotal: {formatPrice(selectItemSubtotal(item))}
        </div>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
          className="w-7 h-7 rounded border border-gray-300 bg-gray-50 cursor-pointer text-base font-semibold flex items-center justify-center"
          aria-label="Disminuir cantidad"
        >
          −
        </button>

        <span className="min-w-[24px] text-center font-medium">
          {item.cantidad}
        </span>

        <button
          onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
          className="w-7 h-7 rounded border border-gray-300 bg-gray-50 cursor-pointer text-base font-semibold flex items-center justify-center"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="bg-transparent border-0 text-red-500 cursor-pointer text-lg p-1 leading-none"
        aria-label="Eliminar item"
        title="Eliminar"
      >
        ✕
      </button>
    </div>
  );
}
