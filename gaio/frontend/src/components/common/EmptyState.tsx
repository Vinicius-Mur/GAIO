import { ReactNode } from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className='text-center'>
    <h3 className='text-lg font-semibold text-brand-900'>{title}</h3>
    <p className='mt-2 text-sm text-gray-600'>{description}</p>
    {action ? <div className='mt-4'>{action}</div> : null}
  </Card>
);
