import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCartStore, selectCartItemsCount, selectCartTotal } from '../../../shared/stores/cartStore';
import { useUIStore } from '../../../shared/stores/uiStore';
import { useDirecciones } from '../../../shared/hooks/useDirecciones';
import { useCreateOrder } from '../../../shared/hooks/useOrders';
import { formatPrice } from '../../../shared/api/orderApi';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const { isAuthenticated } = useAuth();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartOpen = useUIStore((state) => state.cartOpen);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const count = selectCartItemsCount(items);
  const total = selectCartTotal(items);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);

  const { data: direcciones } = useDirecciones();
  const createOrder = useCreateOrder();

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert('Por favor seleccioná una dirección de entrega');
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        carrito: items,
        direccionId: selectedAddressId,
      });
      
      clearCart();
      setShowCheckout(false);
      setOrderSuccess(result.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al crear el pedido');
    }
  };

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { setShowCheckout(false); toggleCart(); }}
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
          width: '420px',
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
            onClick={() => { setShowCheckout(false); toggleCart(); }}
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

        {/* Success Message */}
        {orderSuccess && (
          <div style={{ padding: '20px', background: '#d4edda', color: '#155724' }}>
            <strong>¡Pedido creado exitosamente!</strong>
            <p style={{ margin: '8px 0 0 0' }}>Tu pedido #{orderSuccess} está pendiente de pago.</p>
            <button
              onClick={() => setOrderSuccess(null)}
              style={{ marginTop: '10px', padding: '8px 16px' }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Checkout Form */}
        {showCheckout && !orderSuccess && (
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Finalizar Pedido</h3>
            
            {(!direcciones || direcciones.length === 0) ? (
              <div style={{ color: '#666' }}>
                <p>No tenés direcciones guardadas.</p>
                <a href="/perfil" style={{ color: '#007bff' }}>
                  Agregar dirección en Mi Perfil
                </a>
              </div>
            ) : (
              <>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  Seleccioná dirección de entrega:
                </p>
                {direcciones.map((dir) => (
                  <label
                    key={dir.id}
                    style={{
                      display: 'block',
                      padding: '10px',
                      marginBottom: '8px',
                      border: selectedAddressId === dir.id ? '2px solid #007bff' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === dir.id}
                      onChange={() => setSelectedAddressId(dir.id)}
                      style={{ marginRight: '10px' }}
                    />
                    {dir.calle} {dir.numero}, {dir.ciudad}
                    {dir.es_principal && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#007bff' }}>
                        (Principal)
                      </span>
                    )}
                  </label>
                ))}
              </>
            )}

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCheckout(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                disabled={!selectedAddressId || createOrder.isPending}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedAddressId ? 'pointer' : 'not-allowed',
                  opacity: createOrder.isPending ? 0.7 : 1,
                }}
              >
                {createOrder.isPending ? 'Creando...' : `Confirmar ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        )}

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
          
          {/* Checkout Button */}
          {!showCheckout && items.length > 0 && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Necesitás estar logueado para finalizar un pedido');
                  return;
                }
                setShowCheckout(true);
              }}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '15px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Finalizar Pedido
            </button>
          )}
        </div>
      </div>
    </>
  );
}
