import { ReactNode } from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
  success:
    'bg-green-50 border-green-200 text-green-800',
  error:
    'bg-red-50 border-red-200 text-red-700',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800',
  info:
    'bg-blue-50 border-blue-200 text-blue-800',
};

const variantIcons: Record<AlertVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  onClose,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-lg border p-4 text-sm',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      <span className="mt-0.5 text-base font-bold flex-shrink-0" aria-hidden="true">
        {variantIcons[variant]}
      </span>
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export type { AlertVariant };
