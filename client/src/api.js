// Conversa com a API. Guarda o token do login no navegador.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const token = {
  ler: () => localStorage.getItem('token'),
  salvar: (t) => localStorage.setItem('token', t),
  apagar: () => localStorage.removeItem('token'),
};

let aoDeslogar = () => {};
export const definirAoDeslogar = (fn) => { aoDeslogar = fn; };

async function req(metodo, caminho, corpo) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.ler();
  if (t) headers.Authorization = `Bearer ${t}`;
  let resp;
  try {
    resp = await fetch(`${BASE}/api${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new Error('Não consegui falar com o servidor. Verifique a internet ou tente de novo em alguns segundos.');
  }
  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => ({}));
  if (resp.status === 401 && caminho !== '/auth/login') {
    token.apagar();
    aoDeslogar();
  }
  if (!resp.ok) throw new Error(dados.erro || `Erro ${resp.status}`);
  return dados;
}

export const api = {
  get: (c) => req('GET', c),
  post: (c, corpo) => req('POST', c, corpo),
  patch: (c, corpo) => req('PATCH', c, corpo),
  del: (c) => req('DELETE', c),
  saude: () => fetch(`${BASE}/api/saude`).then((r) => r.ok).catch(() => false),
};
