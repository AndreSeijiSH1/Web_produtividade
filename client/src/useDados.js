import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Busca um caminho da API e devolve { dados, erro, carregando, recarregar }.
export function useDados(caminho, inicial = []) {
  const [dados, setDados] = useState(inicial);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(() => {
    if (!caminho) return Promise.resolve();
    return api.get(caminho)
      .then((d) => { setDados(d); setErro(''); })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [caminho]);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { dados, setDados, erro, carregando, recarregar };
}
