import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={clsx('inline-flex rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800', className)} {...props} />
);
