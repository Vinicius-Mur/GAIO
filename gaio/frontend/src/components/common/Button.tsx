import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-900 text-white hover:bg-brand-800 disabled:bg-brand-700',
  secondary: 'bg-white text-brand-900 border border-brand-200 hover:bg-surface-100',
  ghost: 'bg-transparent text-brand-900 hover:bg-brand-900/10',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-500'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, className, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'focus-ring inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-wide2 transition disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Carregando...' : children}
    </button>
  )
);

Button.displayName = 'Button';
