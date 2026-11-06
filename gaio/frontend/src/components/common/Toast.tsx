import clsx from 'clsx';
import { useToast } from '../../contexts/ToastContext';

const colors = {
  success: 'border-green-300 bg-green-50 text-green-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900'
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className='pointer-events-none fixed right-4 top-4 z-[70] flex w-[320px] flex-col gap-2'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx('pointer-events-auto rounded-xl border p-3 shadow-soft', colors[toast.type])}
          role='status'
        >
          <div className='flex items-start justify-between gap-2'>
            <div>
              <p className='text-sm font-semibold'>{toast.title}</p>
              {toast.description ? <p className='text-xs'>{toast.description}</p> : null}
            </div>
            <button className='focus-ring text-xs font-medium' onClick={() => removeToast(toast.id)}>
              Fechar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
