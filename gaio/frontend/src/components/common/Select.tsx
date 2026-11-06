import { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = ({ label, id, className, error, children, ...props }: SelectProps) => {
  const inputId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className='space-y-1'>
      <label htmlFor={inputId} className='block text-xs font-semibold uppercase tracking-wide text-brand-800'>
        {label}
      </label>
      <select
        id={inputId}
        className={clsx(
          'focus-ring w-full rounded-xl border border-surface-100 bg-surface-100 px-3 py-3 text-sm text-brand-900',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  );
};
