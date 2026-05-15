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
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #eee',
        alignItems: 'flex-start',
      }}
    >
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.nombre}</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {formatPrice(item.priceInCents)} c/u
        </div>

        {/* Ingredientes excluidos */}
        {item.excludedIngredientIds.length > 0 && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Sin ingredientes ID: {item.excludedIngredientIds.join(', ')}
          </div>
        )}

        <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
          Subtotal: {formatPrice(selectItemSubtotal(item))}
        </div>
      </div>

      {/* Quantity controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f9f9f9',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Disminuir cantidad"
        >
          −
        </button>

        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 500 }}>
          {item.cantidad}
        </span>

        <button
          onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f9f9f9',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#e74c3c',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px',
          lineHeight: 1,
        }}
        aria-label="Eliminar item"
        title="Eliminar"
      >
        ✕
      </button>
    </div>
  );
}
