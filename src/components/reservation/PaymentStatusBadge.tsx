/**
 * Payment Status Badge Component
 *
 * Visual badge for displaying payment status with color-coded icons
 *
 * Statuses:
 * - PROCESSED: Payment completed (green)
 * - MIT_PAYMENT_PENDING: Payment in progress (yellow)
 * - AWAITING_MANUAL_PAYMENT: Awaiting payment (orange)
 * - CANCELLED: Payment cancelled (red)
 * - FAILED: Payment failed (red)
 */

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PaymentStatusBadge({
  status,
  className = '',
  showIcon = true,
  size = 'md'
}: PaymentStatusBadgeProps) {
  // Get status configuration
  const getStatusConfig = (
    status: string
  ): {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: JSX.Element;
  } => {
    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
      case 'PROCESSED':
        return {
          label: 'Pago Completado',
          color: 'text-green-800',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };

      case 'MIT_PAYMENT_PENDING':
        return {
          label: 'Pago Pendiente',
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };

      case 'AWAITING_MANUAL_PAYMENT':
        return {
          label: 'Esperando Pago',
          color: 'text-orange-800',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };

      case 'CANCELLED':
      case 'CANCELED':
        return {
          label: 'Pago Cancelado',
          color: 'text-red-800',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };

      case 'FAILED':
        return {
          label: 'Pago Fallido',
          color: 'text-red-800',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };

      default:
        return {
          label: status,
          color: 'text-gray-800',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          icon: (
            <svg
              className="flex-shrink-0"
              width={iconSize}
              height={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        };
    }
  };

  // Size configuration
  const sizeConfig = {
    sm: {
      padding: 'px-2 py-1',
      fontSize: 'text-xs',
      iconSize: 14,
      gap: 'gap-1'
    },
    md: {
      padding: 'px-3 py-1.5',
      fontSize: 'text-sm',
      iconSize: 16,
      gap: 'gap-1.5'
    },
    lg: {
      padding: 'px-4 py-2',
      fontSize: 'text-base',
      iconSize: 20,
      gap: 'gap-2'
    }
  };

  const { padding, fontSize, iconSize, gap } = sizeConfig[size];
  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center ${gap} ${padding} ${config.color} ${config.bgColor} border ${config.borderColor} rounded-full font-medium ${fontSize} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </div>
  );
}
