import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-700 ring-primary-500/20',
  success: 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
  warning: 'bg-amber-100 text-amber-700 ring-amber-500/20',
  error: 'bg-red-100 text-red-700 ring-red-500/20',
  neutral: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full ring-1 ring-inset
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Status Badge - estados comunes de pedidos
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'warning', label: 'Pendiente' },
  'in-progress': { variant: 'primary', label: 'En Proceso' },
  completed: { variant: 'success', label: 'Completado' },
  cancelled: { variant: 'error', label: 'Cancelado' },
  delivered: { variant: 'success', label: 'Entregado' },
  confirmed: { variant: 'primary', label: 'Confirmado' },
  'payment-pending': { variant: 'warning', label: 'Pago Pendiente' },
  paid: { variant: 'success', label: 'Pagado' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const { variant, label } = statusMap[normalizedStatus] || {
    variant: 'neutral',
    label: status,
  };

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}