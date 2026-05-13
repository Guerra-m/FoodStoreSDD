import { useCartStore, selectCartItemsCount } from '../../../shared/stores/cartStore';
import { useUIStore } from '../../../shared/stores/uiStore';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartOpen = useUIStore((state) => state.cartOpen);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const count = selectCartItemsCount(items);

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleCart}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          maxWidth: '100vw',
          height: '100vh',
          background: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            Carrito ({count} {count === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={toggleCart}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
              }}
            >
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                Tu carrito está vacío
              </p>
              <p style={{ fontSize: '14px' }}>
                Agregá productos desde el catálogo
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Summary */}
        <div style={{ padding: '0 20px 20px' }}>
          <CartSummary items={items} />
        </div>
      </div>
    </>
  );
}
