import { toast } from 'react-toastify';

/**
 * Hook que expone funciones de toast tipadas para uso consistente en la app.
 * Wrapper sobre react-toastify con defaults preconfigurados.
 */
export function useToast() {
  return {
    success: (message: string) =>
      toast.success(message, {
        position: 'bottom-right',
        autoClose: 3000,
        theme: 'light',
      }),

    error: (message: string) =>
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 4000,
        theme: 'light',
      }),

    warning: (message: string) =>
      toast.warning(message, {
        position: 'bottom-right',
        autoClose: 3000,
        theme: 'light',
      }),

    info: (message: string) =>
      toast.info(message, {
        position: 'bottom-right',
        autoClose: 3000,
        theme: 'light',
      }),
  };
}
