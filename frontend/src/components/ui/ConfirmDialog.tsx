import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    iconSvg: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    confirmBtn: 'btn-danger',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    iconSvg: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    confirmBtn: 'btn-secondary',
  },
  info: {
    icon: 'bg-primary-100 text-primary-600',
    iconSvg: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    confirmBtn: 'btn-primary',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-3xl shadow-soft-xl max-w-md w-full p-6 animate-scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${styles.icon} flex items-center justify-center mb-5`}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={styles.iconSvg} />
          </svg>
        </div>

        {/* Content */}
        <h3 id="dialog-title" className="text-xl font-bold text-neutral-900 mb-2">
          {title}
        </h3>
        <p id="dialog-description" className="text-neutral-600 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className={variant === 'warning' ? '!bg-amber-500 !text-white hover:!bg-amber-600' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook para usar el ConfirmDialog fácilmente
interface UseConfirmDialogOptions {
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmDialogReturn {
  open: boolean;
  show: (options?: { title?: string; message?: string }) => void;
  hide: () => void;
  options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  };
  confirmDialogProps: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
  };
}

export function useConfirmDialog({ onConfirm }: UseConfirmDialogOptions): UseConfirmDialogReturn {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({
    title: '¿Estás seguro?',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger' as const,
  });

  const show = (customOptions?: Partial<typeof options>) => {
    setOptions((prev) => ({ ...prev, ...customOptions }));
    setOpen(true);
  };

  const hide = () => setOpen(false);

  const handleConfirm = async () => {
    await onConfirm();
    hide();
  };

  return {
    open,
    show,
    hide,
    options,
    confirmDialogProps: {
      open,
      onClose: hide,
      onConfirm: handleConfirm,
      ...options,
    },
  };
}

// Alias para compatibilidad
export default ConfirmDialog;