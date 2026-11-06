import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
    <div>
      <h1 className='text-2xl font-semibold text-brand-900'>{title}</h1>
      {subtitle ? <p className='mt-1 text-sm text-gray-600'>{subtitle}</p> : null}
    </div>
    {action}
  </div>
);
