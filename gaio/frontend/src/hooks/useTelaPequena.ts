import { useEffect, useState } from 'react';

const CONSULTA = '(max-width: 640px)';

const combina = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA).matches;

// Graficos encolhem o eixo de nomes e abreviam rotulos no celular.
export const useTelaPequena = () => {
  const [pequena, setPequena] = useState(combina);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const consulta = window.matchMedia(CONSULTA);
    const atualizar = () => setPequena(consulta.matches);
    consulta.addEventListener('change', atualizar);
    return () => consulta.removeEventListener('change', atualizar);
  }, []);

  return pequena;
};
