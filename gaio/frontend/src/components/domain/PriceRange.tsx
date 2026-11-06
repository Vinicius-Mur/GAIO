interface PriceRangeProps {
  min: number;
  max: number;
  maxDigitado: number;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

// O slider cobre a faixa comum; o campo numerico aceita areas maiores, ate o limite da API.
export const PriceRange = ({ min, max, maxDigitado, value, onChange, error }: PriceRangeProps) => (
  <div>
    <div className='mb-2 flex items-center justify-between gap-3 text-sm'>
      <label htmlFor='area-imovel' className='font-medium text-brand-900'>Área do imóvel</label>
      <div className='flex items-center gap-1'>
        <input
          id='area-imovel'
          type='number'
          min={1}
          max={maxDigitado}
          value={Number.isFinite(value) ? value : ''}
          onChange={(event) => onChange(Number(event.target.value))}
          className='focus-ring w-24 rounded-lg border border-surface-100 bg-surface-100 px-2 py-1 text-right font-semibold text-accent-500'
        />
        <span className='font-semibold text-accent-500'>m²</span>
      </div>
    </div>
    <input
      type='range'
      min={min}
      max={max}
      value={Math.min(Math.max(value || min, min), max)}
      onChange={(event) => onChange(Number(event.target.value))}
      className='w-full accent-accent-500'
      aria-label='Área do imóvel em metros quadrados'
    />
    <div className='mt-1 flex justify-between text-xs text-gray-500'>
      <span>{min}m²</span>
      <span>{max}m²+ (digite para áreas maiores)</span>
    </div>
    {error ? <p className='mt-1 text-xs text-red-600'>{error}</p> : null}
  </div>
);
