import { useEffect, useRef } from 'react';

// Janela simples: fecha com Esc ou clicando fora.
export default function Modal({ titulo, aoFechar, children }) {
  const ref = useRef(null);
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;

  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') fechar.current(); };
    document.addEventListener('keydown', tecla);
    const anterior = document.activeElement;
    ref.current?.querySelector('input, textarea, select, button')?.focus();
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus?.(); };
  }, []);

  return (
    <div className="fundo-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar.current(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} ref={ref}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
