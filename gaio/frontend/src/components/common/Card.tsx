import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('rounded-2xl bg-white p-5 shadow-soft', className)} {...props} />
);
