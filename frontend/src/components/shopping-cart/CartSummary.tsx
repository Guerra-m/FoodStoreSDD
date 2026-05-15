import type { CartItem } from '../../types/shopping-cart';
import { selectCartTotal, selectCartItemsCount } from '../../stores/cartStore';

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

interface CartSummaryProps {
  items: CartItem[];
}

export default function CartSummary({ items }: CartSummaryProps) {
  const total = selectCartTotal(items);
  const count = selectCartItemsCount(items);

  if (items.length === 0) return null;

  return (
    <div className="py-4 border-t-2 border-gray-800 mt-2">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Items ({count} unidades)</span>
        <span>{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
