export const Loading = ({ text = 'Carregando...' }: { text?: string }) => (
  <div className='flex items-center justify-center gap-3 py-8 text-sm text-brand-800'>
    <span className='h-5 w-5 animate-spin rounded-full border-2 border-brand-900 border-t-transparent' />
    {text}
  </div>
);
