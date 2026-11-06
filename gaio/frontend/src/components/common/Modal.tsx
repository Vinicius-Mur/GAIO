import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  children?: ReactNode;
}

export const Modal = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
  loading,
  children
}: ModalProps) => {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-soft'>
        <h3 className='text-lg font-semibold text-brand-900'>{title}</h3>
        <p className='mt-2 text-sm text-gray-600'>{description}</p>
        {children ? <div className='mt-4'>{children}</div> : null}
        <div className='mt-6 flex justify-end gap-3'>
          <Button variant='secondary' onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
