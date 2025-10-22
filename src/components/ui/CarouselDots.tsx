'use client';

interface CarouselDotsProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
  className?: string;
  dotSize?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

/**
 * Componente de dots navegables para carruseles
 * Muestra indicadores visuales del número de items y permite navegación
 */
export function CarouselDots({
  total,
  current,
  onDotClick,
  className = '',
  dotSize = 'md',
  variant = 'light'
}: CarouselDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const variantClasses = {
    light: {
      active: 'bg-white',
      inactive: 'bg-white/40 hover:bg-white/60'
    },
    dark: {
      active: 'bg-gray-900',
      inactive: 'bg-gray-300 hover:bg-gray-500'
    }
  };

  const colors = variantClasses[variant];

  if (total <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`
            ${sizeClasses[dotSize]}
            rounded-full
            transition-all
            duration-300
            ${index === current ? colors.active : colors.inactive}
            ${index === current ? 'scale-125' : 'scale-100'}
            hover:scale-110
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            ${variant === 'light' ? 'focus:ring-white' : 'focus:ring-gray-900'}
          `}
          aria-label={`Ir a item ${index + 1}`}
          aria-current={index === current ? 'true' : 'false'}
        />
      ))}
    </div>
  );
}
