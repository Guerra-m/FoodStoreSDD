import { create } from 'zustand';

interface PaymentState {
  status: 'idle' | 'processing' | 'approved' | 'rejected' | 'error';
  setPaymentStatus: (status: PaymentState['status']) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  status: 'idle',
  setPaymentStatus: (status) => set({ status }),
}));
