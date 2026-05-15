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

  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const { data: direcciones } = useDirecciones();
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const { data: pagoData } = usePagoByPedido(orderSuccess, pollingEnabled);

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
        await createPayment.mutateAsync({ card_token: token, pedido_id: orderSuccess });
        setPollingEnabled(true);
      } catch (err: any) {
        usePaymentStore.getState().setError(err.response?.data?.detail || 'Error al procesar el pago');
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

  useEffect(() => {
    if (!pagoData || !pollingEnabled) return;
    const { mp_status, mp_payment_id, status_detail } = pagoData;
    if (mp_status === 'approved') {
      usePaymentStore.getState().setApproved(mp_payment_id ?? 0, status_detail ?? undefined);
      setPollingEnabled(false);
    } else if (mp_status === 'rejected') {
      usePaymentStore.getState().setRejected(status_detail ?? undefined);
      setPollingEnabled(false);
    }
  }, [pagoData, pollingEnabled]);

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCloseDrawer}
        className="fixed inset-0 bg-black/40 z-[999]"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 w-[420px] max-w-[100vw] h-screen bg-white z-[1000] flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="m-0 text-lg">
            Carrito ({count} {count === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={handleCloseDrawer}
            className="bg-transparent border-0 text-[22px] cursor-pointer p-1 leading-none"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Success + Payment section */}
        {orderSuccess && (
          <div className="px-5 py-5 bg-green-50 border-b border-green-200">
            <strong className="text-green-800">
              ¡Pedido #{orderSuccess} creado!
            </strong>

            {!showPayment && paymentStatus !== 'approved' && paymentStatus !== 'processing' && (
              <>
                <p className="mt-2 mb-0 text-sm text-green-800">
                  Ahora completá el pago para confirmar tu pedido.
                </p>
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <button
                    onClick={() => setShowPayment(true)}
                    className="px-5 py-2.5 bg-green-600 text-white border-0 rounded cursor-pointer font-bold text-sm"
                  >
                    Pagar ahora
                  </button>
                  <button
                    onClick={() => navigate(`/order-confirmation/${orderSuccess}`)}
                    className="px-5 py-2.5 bg-transparent text-blue-500 border border-blue-500 rounded cursor-pointer text-sm"
                  >
                    Ver detalle
                  </button>
                  <button
                    onClick={() => setOrderSuccess(null)}
                    className="px-5 py-2.5 bg-transparent text-gray-500 border border-gray-300 rounded cursor-pointer text-sm"
                  >
                    Después
                  </button>
                </div>
              </>
            )}

            {showPayment && orderSuccess && (
              <div className="mt-2.5">
                <PaymentForm totalInCents={total} onPayment={handlePaymentToken} />
              </div>
            )}

            {pollingEnabled && paymentStatus === 'processing' && (
              <div className="mt-2.5 p-2.5 bg-yellow-100 rounded text-xs text-yellow-800">
                ⏳ Verificando pago... Esto puede tomar unos segundos.
              </div>
            )}

            {paymentStatus === 'approved' && (
              <div className="mt-2.5 p-2.5 bg-green-100 rounded text-sm text-green-800">
                ✅ Pago aprobado. Tu pedido ya está en proceso.
              </div>
            )}

            {paymentStatus === 'rejected' && (
              <div className="mt-2.5 p-2.5 bg-red-100 rounded text-sm text-red-800">
                ❌ Pago rechazado. Intentá con otro medio de pago.
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="mt-2.5 p-2.5 bg-red-100 rounded text-sm text-red-800">
                ⚠️ Error al procesar el pago. Intentá de nuevo.
              </div>
            )}

            {(paymentStatus === 'approved' || paymentStatus === 'rejected') && (
              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={() => navigate(`/order-confirmation/${orderSuccess}`)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white border-0 rounded cursor-pointer text-sm"
                >
                  Ver detalle del pedido
                </button>
                <button
                  onClick={handleCloseDrawer}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white border-0 rounded cursor-pointer text-sm"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Checkout Form */}
        {showCheckout && !orderSuccess && (
          <div className="px-5 py-5 border-b border-gray-200">
            <h3 className="m-0 mb-4">Finalizar Pedido</h3>

            {(!direcciones || direcciones.length === 0) ? (
              <div className="text-gray-500">
                <p>No tenés direcciones guardadas.</p>
                <a href="/perfil" className="text-blue-500">Agregar dirección en Mi Perfil</a>
              </div>
            ) : (
              <>
                <p className="mb-2.5 font-bold">Seleccioná dirección de entrega:</p>
                {direcciones.map((dir) => (
                  <label
                    key={dir.id}
                    className={`block p-2.5 mb-2 rounded cursor-pointer ${
                      selectedAddressId === dir.id
                        ? 'border-2 border-blue-500'
                        : 'border border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === dir.id}
                      onChange={() => setSelectedAddressId(dir.id)}
                      className="mr-2"
                    />
                    {dir.calle} {dir.numero}, {dir.ciudad}
                    {dir.es_principal && (
                      <span className="ml-2 text-xs text-blue-500">(Principal)</span>
                    )}
                  </label>
                ))}
              </>
            )}

            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 p-2.5 bg-gray-500 text-white border-0 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                disabled={!selectedAddressId || createOrder.isPending}
                className={`flex-1 p-2.5 text-white border-0 rounded ${
                  !selectedAddressId || createOrder.isPending
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-green-600 cursor-pointer'
                }`}
              >
                {createOrder.isPending ? 'Creando...' : `Confirmar ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-base mb-2">Tu carrito está vacío</p>
              <p className="text-sm">Agregá productos desde el catálogo</p>
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
        <div className="px-5 pb-5">
          <CartSummary items={items} />

          {!showCheckout && items.length > 0 && !orderSuccess && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  toast.warning('Necesitás estar logueado para finalizar un pedido');
                  return;
                }
                setShowCheckout(true);
              }}
              className="w-full py-3.5 mt-4 bg-blue-500 text-white border-0 rounded-lg text-base font-bold cursor-pointer"
            >
              Finalizar Pedido
            </button>
          )}
        </div>
      </div>
    </>
  );
}
