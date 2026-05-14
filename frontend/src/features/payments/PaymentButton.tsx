import { useState } from 'react';
import { useCrearPreferenciaPago } from '../../shared/hooks/useOrders';
import { usePaymentStore } from '../../shared/stores/paymentStore';
import { toast } from 'react-toastify';

interface PaymentButtonProps {
  pedidoId: number;
  disabled?: boolean;
}

export default function PaymentButton({ pedidoId, disabled }: PaymentButtonProps) {
  const [processing, setProcessing] = useState(false);
  const mutation = useCrearPreferenciaPago();
  const setPaymentStatus = usePaymentStore((s) => s.setPaymentStatus);

  const handlePay = async () => {
    if (processing) return;
    setProcessing(true);
    setPaymentStatus('processing');

    try {
      const result = await mutation.mutateAsync(pedidoId);
      setPaymentStatus('approved');

      // Redirigir al checkout de MercadoPago
      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        toast.error('Error al obtener la URL de pago');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Error al procesar el pago';
      toast.error(message);
      setPaymentStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={disabled || processing || mutation.isPending}
      style={{
        padding: '12px 24px',
        background: processing || mutation.isPending ? '#6b7280' : '#059669',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled || processing ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'background 0.2s',
      }}
    >
      {processing || mutation.isPending ? 'Procesando...' : 'Pagar ahora'}
    </button>
  );
}
