import type { CartItem } from '../types';
import { selectCartTotal, selectCartItemsCount } from '../../../shared/stores/cartStore';

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

interface CartSummaryProps {
  items: CartItem[];
}

export default function CartSummary({ items }: CartSummaryProps) {
  const total = selectCartTotal(items);
  const count = selectCartItemsCount(items);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: '16px 0',
        borderTop: '2px solid #333',
        marginTop: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#666',
          marginBottom: '8px',
        }}
      >
        <span>Items ({count} unidades)</span>
        <span>{formatPrice(total)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
