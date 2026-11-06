import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { enderecoService } from '../../services/enderecoService';
import { EnderecoDetalhes, EnderecoSuggestion } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/error';

interface AddressAutocompleteProps {
  value: string;
  onInputChange: (value: string) => void;
  onAddressSelected: (payload: { suggestion: EnderecoSuggestion; details: EnderecoDetalhes }) => void;
  error?: string;
}

export const AddressAutocomplete = ({ value, onInputChange, onAddressSelected, error }: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<EnderecoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [listError, setListError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debouncedValue = useDebounce(value, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setListError(null);
      try {
        const data = await enderecoService.autocomplete(debouncedValue);
        if (!cancelled) {
          setSuggestions(data);
          setOpen(true);
          setActiveIndex(data.length ? 0 : -1);
        }
      } catch (err) {
        if (!cancelled) {
          setListError(getErrorMessage(err));
          setSuggestions([]);
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const selectSuggestion = async (item: EnderecoSuggestion) => {
    setOpen(false);
    const details = await enderecoService.detalhes(item.placeId);
    onAddressSelected({ suggestion: item, details });
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      await selectSuggestion(suggestions[activeIndex]);
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const helper = useMemo(() => {
    if (error) return error;
    if (listError) return listError;
    return 'Escolha uma das sugestões da busca.';
  }, [error, listError]);

  return (
    <div className='space-y-1' ref={wrapperRef}>
      <label htmlFor='endereco' className='block text-xs font-semibold uppercase tracking-wide text-brand-800'>
        Endereço ou bairro
      </label>
      <input
        id='endereco'
        className='focus-ring w-full rounded-xl border border-surface-100 bg-surface-100 px-3 py-3 text-sm text-brand-900 placeholder:text-gray-400'
        value={value}
        onChange={(event) => {
          onInputChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder='Ex: Vila Mariana, São Paulo'
        autoComplete='off'
        aria-autocomplete='list'
        aria-expanded={open}
        aria-controls='address-options'
      />
      <p className='text-xs text-gray-500'>{helper}</p>
      {open && (loading || suggestions.length > 0 || listError) ? (
        <ul id='address-options' className='max-h-60 overflow-auto rounded-xl border border-surface-100 bg-white p-1 shadow-soft'>
          {loading ? <li className='px-3 py-2 text-sm text-gray-600'>Buscando sugestões...</li> : null}
          {!loading && suggestions.length === 0 && !listError ? (
            <li className='px-3 py-2 text-sm text-gray-600'>Nenhuma sugestão encontrada.</li>
          ) : null}
          {suggestions.map((item, index) => (
            <li key={item.placeId}>
              <button
                type='button'
                className={`focus-ring w-full rounded-lg px-3 py-2 text-left text-sm ${index === activeIndex ? 'bg-surface-100 text-brand-900' : 'hover:bg-surface-50'}`}
                onClick={() => void selectSuggestion(item)}
              >
                {item.descricao}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
