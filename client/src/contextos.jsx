import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, token, definirAoDeslogar } from './api';

/* ================= Login ================= */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(token.ler()));

  useEffect(() => {
    definirAoDeslogar(() => setUsuario(null));
    if (!token.ler()) return;
    api.get('/auth/eu')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  const entrar = async (email, senha) => {
    const r = await api.post('/auth/login', { email, senha });
    token.salvar(r.token);
    setUsuario(r.usuario);
  };
  const sair = () => { token.apagar(); setUsuario(null); };

  return <AuthCtx.Provider value={{ usuario, carregando, entrar, sair }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ================= Tema claro/escuro ================= */
const TemaCtx = createContext(null);
const escuroNoSistema = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function TemaProvider({ children }) {
  const [modo, setModo] = useState(() => localStorage.getItem('tema') || 'sistema');
  const [sistemaEscuro, setSistemaEscuro] = useState(escuroNoSistema);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const ouvir = (e) => setSistemaEscuro(e.matches);
    mq.addEventListener('change', ouvir);
    return () => mq.removeEventListener('change', ouvir);
  }, []);

  const tema = modo === 'sistema' ? (sistemaEscuro ? 'escuro' : 'claro') : modo;
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('tema', modo);
  }, [tema, modo]);

  // sistema -> claro -> escuro -> sistema
  const alternar = () => setModo((m) => (m === 'sistema' ? 'claro' : m === 'claro' ? 'escuro' : 'sistema'));

  return <TemaCtx.Provider value={{ modo, tema, alternar }}>{children}</TemaCtx.Provider>;
}
export const useTema = () => useContext(TemaCtx);

/* ================= Pomodoro =================
   O timer vive aqui (fora das páginas) para continuar rodando
   enquanto você navega, e é salvo no navegador para sobreviver a um F5. */
export const PRESETS_PADRAO = [
  { id: 'classico', nome: 'Clássico', foco: 25, pausa: 5, longa: 15 },
  { id: 'longo', nome: 'Foco longo', foco: 50, pausa: 10, longa: 20 },
  { id: 'imersao', nome: 'Imersão', foco: 90, pausa: 20, longa: 30 },
  { id: 'rapido', nome: 'Rápido', foco: 15, pausa: 3, longa: 10 },
];
export const CICLOS_ATE_LONGA = 4;

const PomoCtx = createContext(null);
const CHAVE = 'pomodoro';
const CHAVE_FILA = 'pomodoro-fila';

const estadoInicial = {
  presetId: 'classico', fase: 'foco', ciclo: 1, rodando: false,
  fimEm: null, restante: 25 * 60, blocoInicio: null, disciplinaId: '',
};

function bip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch { /* sem som, tudo bem */ }
}

function avisar(texto) {
  bip();
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Pomodoro', { body: texto, icon: '/favicon.svg' }); } catch { /* ignora */ }
  }
}

export function PomodoroProvider({ children }) {
  const { usuario } = useAuth();
  const [e, setE] = useState(() => {
    try { return { ...estadoInicial, ...JSON.parse(localStorage.getItem(CHAVE)) }; } catch { return estadoInicial; }
  });
  const [agora, setAgora] = useState(Date.now());
  const [personalizados, setPersonalizados] = useState([]);
  const [versao, setVersao] = useState(0); // muda quando uma sessão é salva
  const concluindo = useRef(false);

  useEffect(() => { localStorage.setItem(CHAVE, JSON.stringify(e)); }, [e]);

  // Pré-sets personalizados vêm do banco
  const carregarPresets = useCallback(() => {
    if (!usuario) return;
    api.get('/presets').then((lista) => setPersonalizados(lista.map((p) => ({
      id: `c-${p.id}`, dbId: p.id, nome: p.nome, foco: p.foco_min, pausa: p.pausa_min, longa: p.longa_min, personalizado: true,
    })))).catch(() => {});
  }, [usuario]);
  useEffect(carregarPresets, [carregarPresets]);

  const presets = useMemo(() => [...PRESETS_PADRAO, ...personalizados], [personalizados]);
  const preset = presets.find((p) => p.id === e.presetId) || PRESETS_PADRAO[0];
  const minutos = useCallback((fase, p = preset) => (fase === 'foco' ? p.foco : fase === 'pausa' ? p.pausa : p.longa), [preset]);
  const total = minutos(e.fase) * 60;
  const restante = e.rodando ? Math.max(0, Math.ceil((e.fimEm - agora) / 1000)) : e.restante;

  // Envia sessões ao banco; se falhar, guarda numa fila e tenta de novo depois.
  const enviarFila = useCallback(async () => {
    let fila;
    try { fila = JSON.parse(localStorage.getItem(CHAVE_FILA)) || []; } catch { fila = []; }
    if (!fila.length || !token.ler()) return;
    const sobrou = [];
    for (const s of fila) {
      try { await api.post('/sessoes', s); } catch { sobrou.push(s); }
    }
    localStorage.setItem(CHAVE_FILA, JSON.stringify(sobrou));
    if (sobrou.length < fila.length) setVersao((v) => v + 1);
  }, []);
  useEffect(() => { if (usuario) enviarFila(); }, [usuario, enviarFila]);

  const salvarSessao = useCallback((inicio, segundos, completa, disciplinaId) => {
    if (segundos < 60) return; // menos de 1 minuto não conta
    let fila;
    try { fila = JSON.parse(localStorage.getItem(CHAVE_FILA)) || []; } catch { fila = []; }
    fila.push({ inicio, duracao_seg: segundos, completa, disciplina_id: disciplinaId || null });
    localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
    enviarFila();
  }, [enviarFila]);

  // Salva o que já foi estudado no bloco de foco atual (quando interrompido)
  const registrarParcial = useCallback(() => {
    if (e.fase === 'foco' && e.blocoInicio) salvarSessao(e.blocoInicio, total - restante, false, e.disciplinaId);
  }, [e, total, restante, salvarSessao]);

  const proximaFase = (s, p = preset) => {
    if (s.fase === 'foco') {
      const fase = s.ciclo % CICLOS_ATE_LONGA === 0 ? 'longa' : 'pausa';
      return { ...s, fase, restante: minutos(fase, p) * 60, blocoInicio: null };
    }
    return { ...s, fase: 'foco', ciclo: s.fase === 'longa' ? 1 : s.ciclo + 1, restante: minutos('foco', p) * 60, blocoInicio: null };
  };

  // Relógio: atualiza a tela e detecta o fim de cada fase
  useEffect(() => {
    if (!e.rodando) return undefined;
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [e.rodando]);

  useEffect(() => {
    if (!e.rodando || restante > 0 || concluindo.current) return;
    concluindo.current = true;
    if (e.fase === 'foco') {
      salvarSessao(e.blocoInicio || new Date(Date.now() - total * 1000).toISOString(), total, true, e.disciplinaId);
      const prox = proximaFase(e);
      avisar(prox.fase === 'longa' ? 'Foco concluído! Hora da pausa longa.' : 'Foco concluído! Hora da pausa.');
      // a pausa começa sozinha
      setE({ ...prox, rodando: true, fimEm: Date.now() + prox.restante * 1000 });
    } else {
      avisar('Pausa acabou. Bora voltar ao foco?');
      setE({ ...proximaFase(e), rodando: false, fimEm: null });
    }
    setTimeout(() => { concluindo.current = false; }, 500);
  }, [restante, e]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mostra o tempo na aba do navegador
  useEffect(() => {
    const mm = String(Math.floor(restante / 60)).padStart(2, '0');
    const ss = String(restante % 60).padStart(2, '0');
    document.title = e.rodando ? `${mm}:${ss} · ${e.fase === 'foco' ? 'Foco' : 'Pausa'}` : 'Organizador Acadêmico';
  }, [restante, e.rodando, e.fase]);

  const acoes = {
    iniciar: () => {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      setAgora(Date.now());
      setE((s) => ({
        ...s, rodando: true, fimEm: Date.now() + s.restante * 1000,
        blocoInicio: s.fase === 'foco' && !s.blocoInicio ? new Date().toISOString() : s.blocoInicio,
      }));
    },
    pausar: () => setE((s) => ({ ...s, rodando: false, fimEm: null, restante })),
    reiniciar: () => {
      registrarParcial();
      setE((s) => ({ ...s, fase: 'foco', ciclo: 1, rodando: false, fimEm: null, restante: minutos('foco') * 60, blocoInicio: null }));
    },
    pular: () => {
      registrarParcial();
      setE((s) => ({ ...proximaFase(s), rodando: false, fimEm: null }));
    },
    escolherPreset: (id, novo) => {
      const p = novo || presets.find((x) => x.id === id);
      if (!p) return;
      registrarParcial();
      setE((s) => ({ ...s, presetId: id, fase: 'foco', ciclo: 1, rodando: false, fimEm: null, restante: p.foco * 60, blocoInicio: null }));
    },
    escolherDisciplina: (id) => setE((s) => ({ ...s, disciplinaId: id })),
    recarregarPresets: carregarPresets,
  };

  const valor = {
    ...e, restante, total, preset, presets, versao, ...acoes,
    // tempo de foco do bloco atual ainda não salvo (para somar no "hoje" ao vivo)
    focoEmAndamento: e.fase === 'foco' && e.blocoInicio ? total - restante : 0,
  };
  return <PomoCtx.Provider value={valor}>{children}</PomoCtx.Provider>;
}
export const usePomodoro = () => useContext(PomoCtx);
