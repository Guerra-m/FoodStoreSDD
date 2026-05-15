import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore, selectCartItemsCount, selectCartTotal } from '../../stores/cartStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useUIStore } from '../../stores/uiStore';
import { useDirecciones } from '../../hooks/useDirecciones';
import { useCreateOrder } from '../../hooks/useOrders';
import { useCreatePayment, usePagoByPedido } from '../../hooks/usePago';
import { formatPrice } from '../../api/orders';
import PaymentForm from '../../components/PaymentForm';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartOpen = useUIStore((state) => state.cartOpen);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const count = selectCartItemsCount(items);
  const total = selectCartTotal(items);

  const paymentStatus = usePaymentStore((state) => state.status);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);

  // Payment step state
  const [showPayment, setShowPayment] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const { data: direcciones } = useDirecciones();
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const { data: pagoData } = usePagoByPedido(
    orderSuccess,
    pollingEnabled,
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.warning('Seleccioná una dirección de entrega');
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        carrito: items,
        direccionId: selectedAddressId,
      });

      toast.success(`Pedido #${result.id} creado con éxito`);
      clearCart();
      setShowCheckout(false);
      setOrderSuccess(result.id);
      setShowPayment(false);
      usePaymentStore.getState().reset();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al crear el pedido');
    }
  };

  const handlePaymentToken = useCallback(
    async (token: string) => {
      if (!orderSuccess) return;

      usePaymentStore.getState().setProcessing();

      try {
        await createPayment.mutateAsync({
          card_token: token,
          pedido_id: orderSuccess,
        });
        setPollingEnabled(true);
      } catch (err: any) {
        usePaymentStore
          .getState()
          .setError(
            err.response?.data?.detail || 'Error al procesar el pago',
          );
      }
    },
    [orderSuccess, createPayment],
  );

  const handleCloseDrawer = () => {
    setShowCheckout(false);
    setShowPayment(false);
    setOrderSuccess(null);
    setPollingEnabled(false);
    usePaymentStore.getState().reset();
    toggleCart();
  };

  // Sync polling data → paymentStore when terminal status arrives
  useEffect(() => {
    if (!pagoData || !pollingEnabled) return;

    const { mp_status, mp_payment_id, status_detail } = pagoData;

    if (mp_status === 'approved') {
      usePaymentStore
        .getState()
        .setApproved(mp_payment_id ?? 0, status_detail ?? undefined);
      setPollingEnabled(false);
    } else if (mp_status === 'rejected') {
      usePaymentStore
        .getState()
        .setRejected(status_detail ?? undefined);
      setPollingEnabled(false);
    }
  }, [pagoData, pollingEnabled]);

  if (!cartOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCloseDrawer}
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
            onClick={handleCloseDrawer}
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

        {/* Success + Payment section */}
        {orderSuccess && (
          <div
            style={{
              padding: '20px',
              background: '#e8f5e9',
              borderBottom: '1px solid #c8e6c9',
            }}
          >
            <strong style={{ color: '#155724' }}>
              ¡Pedido #{orderSuccess} creado!
            </strong>

            {/* Show payment option if not yet paid */}
            {!showPayment &&
              paymentStatus !== 'approved' &&
              paymentStatus !== 'processing' && (
                <>
                  <p style={{ margin: '8px 0 0 0', color: '#155724', fontSize: '14px' }}>
                    Ahora completá el pago para confirmar tu pedido.
                  </p>
                  <button
                    onClick={() => setShowPayment(true)}
                    style={{
                      marginTop: '10px',
                      padding: '10px 20px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Pagar ahora
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/order-confirmation/${orderSuccess}`);
                    }}
                    style={{
                      marginTop: '10px',
                      marginLeft: '10px',
                      padding: '10px 20px',
                      background: 'transparent',
                      color: '#007bff',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Ver detalle
                  </button>
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                    }}
                    style={{
                      marginTop: '10px',
                      marginLeft: '10px',
                      padding: '10px 20px',
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Después
                  </button>
                </>
              )}

            {/* Payment form */}
            {showPayment && orderSuccess && (
              <div style={{ marginTop: '10px' }}>
                <PaymentForm
                  totalInCents={total}
                  onPayment={handlePaymentToken}
                />
              </div>
            )}

            {/* Polling indicator */}
            {pollingEnabled && paymentStatus === 'processing' && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#856404',
                }}
              >
                ⏳ Verificando pago... Esto puede tomar unos segundos.
              </div>
            )}

            {/* Approved message */}
            {paymentStatus === 'approved' && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#d4edda',
                  borderRadius: '4px',
                  color: '#155724',
                  fontSize: '14px',
                }}
              >
                ✅ Pago aprobado. Tu pedido ya está en proceso.
              </div>
            )}

            {/* Rejected message */}
            {paymentStatus === 'rejected' && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f8d7da',
                  borderRadius: '4px',
                  color: '#721c24',
                  fontSize: '14px',
                }}
              >
                ❌ Pago rechazado. Intentá con otro medio de pago.
              </div>
            )}

            {/* Error message */}
            {paymentStatus === 'error' && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f8d7da',
                  borderRadius: '4px',
                  color: '#721c24',
                  fontSize: '14px',
                }}
              >
                ⚠️ Error al procesar el pago. Intentá de nuevo.
              </div>
            )}

            {/* Finished — close */}
            {(paymentStatus === 'approved' || paymentStatus === 'rejected') && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    navigate(`/order-confirmation/${orderSuccess}`);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Ver detalle del pedido
                </button>
                <button
                  onClick={handleCloseDrawer}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cerrar
                </button>
              </div>
            )}
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
          {!showCheckout && items.length > 0 && !orderSuccess && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  toast.warning('Necesitás estar logueado para finalizar un pedido');
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
