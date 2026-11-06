import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, helperText, error, className, endAdornment, ...props }, ref) => {
    const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className='space-y-1'>
        <label htmlFor={inputId} className='block text-xs font-semibold uppercase tracking-wide text-brand-800'>
          {label}
        </label>
        <div className='relative'>
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'focus-ring w-full rounded-xl border border-surface-100 bg-surface-100 px-3 py-3 text-sm text-brand-900 placeholder:text-gray-400',
              error && 'border-red-500',
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {endAdornment && <div className='absolute right-3 top-1/2 -translate-y-1/2'>{endAdornment}</div>}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className='text-xs text-red-600'>
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className='text-xs text-gray-500'>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
