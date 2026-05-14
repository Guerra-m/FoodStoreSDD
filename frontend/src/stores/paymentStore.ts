import { create } from 'zustand';

type PaymentStatus = 'idle' | 'processing' | 'approved' | 'rejected' | 'error' | 'pending';

interface PaymentState {
  /** Estado del flujo de pago */
  status: PaymentStatus;
  /** ID del pago devuelto por MercadoPago (disponible tras crear el pago) */
  mpPaymentId: number | null;
  /** Detalle del estado (ej. "accredited", "pending", "rejected") */
  statusDetail: string | null;
  /** Mensaje de error si status === 'error' */
  error: string | null;

  // ─── Acciones ───
  setProcessing: () => void;
  setApproved: (mpPaymentId: number, statusDetail?: string) => void;
  setRejected: (statusDetail?: string) => void;
  setPending: (statusDetail?: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState: Pick<
  PaymentState,
  'status' | 'mpPaymentId' | 'statusDetail' | 'error'
> = {
  status: 'idle',
  mpPaymentId: null,
  statusDetail: null,
  error: null,
};

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,

  setProcessing: () =>
    set({ status: 'processing', mpPaymentId: null, statusDetail: null, error: null }),

  setApproved: (mpPaymentId, statusDetail) =>
    set({ status: 'approved', mpPaymentId, statusDetail: statusDetail ?? null }),

  setRejected: (statusDetail) =>
    set({ status: 'rejected', mpPaymentId: null, statusDetail: statusDetail ?? null }),

  setPending: (statusDetail) =>
    set({ status: 'pending', mpPaymentId: null, statusDetail: statusDetail ?? null }),

  setError: (error) =>
    set({ status: 'error', mpPaymentId: null, statusDetail: null, error }),

  reset: () => set({ ...initialState }),
}));
