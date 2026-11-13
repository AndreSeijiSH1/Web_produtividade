import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, usePomodoro, useTema } from './contextos';
import * as I from './Icones';
import Login from './paginas/Login';
import Inicio from './paginas/Inicio';
import Agenda from './paginas/Agenda';
import Links from './paginas/Links';
import Notas from './paginas/Notas';
import Pomodoro from './paginas/Pomodoro';

const MENU = [
  { para: '/', nome: 'Início', curto: 'Início', icone: I.Casa },
  { para: '/agenda', nome: 'Agenda', curto: 'Agenda', icone: I.Calendario },
  { para: '/links', nome: 'Links', curto: 'Links', icone: I.Corrente },
  { para: '/notas', nome: 'Anotações', curto: 'Notas', icone: I.Nota },
  { para: '/pomodoro', nome: 'Pomodoro', curto: 'Foco', icone: I.Relogio },
];

function BotaoTema({ comTexto }) {
  const { modo, alternar } = useTema();
  const info = {
    sistema: { icone: <I.Monitor />, texto: 'Tema: sistema' },
    claro: { icone: <I.Sol />, texto: 'Tema: claro' },
    escuro: { icone: <I.Lua />, texto: 'Tema: escuro' },
  }[modo];
  if (comTexto) {
    return (
      <button type="button" className="menu-item" onClick={alternar} style={{ border: 0, background: 'transparent', cursor: 'pointer', width: '100%' }}>
        {info.icone}{info.texto}
      </button>
    );
  }
  return <button type="button" className="botao-icone" onClick={alternar} aria-label={`${info.texto}. Clique para trocar`}>{info.icone}</button>;
}

function TempoMini() {
  const p = usePomodoro();
  if (!p.rodando) return null;
  const mm = String(Math.floor(p.restante / 60)).padStart(2, '0');
  const ss = String(p.restante % 60).padStart(2, '0');
  return <span className="tempo-mini">{mm}:{ss}</span>;
}

function Estrutura({ children }) {
  const { usuario, sair } = useAuth();
  const inicial = (usuario.nome || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="app">
      <nav className="lateral" aria-label="Menu principal">
        <div className="marca"><img src="/favicon.svg" alt="" />Organizador</div>
        {MENU.map((m) => (
          <NavLink key={m.para} to={m.para} end={m.para === '/'} className={({ isActive }) => `menu-item${isActive ? ' ativo' : ''}`}>
            <m.icone />{m.nome}{m.para === '/pomodoro' && <TempoMini />}
          </NavLink>
        ))}
        <div className="lateral-rodape">
          <BotaoTema comTexto />
          <div className="usuario">
            <div className="avatar" aria-hidden="true">{inicial}</div>
            <span style={{ flex: 1, fontWeight: 600 }}>{usuario.nome}</span>
            <button type="button" className="botao-icone" onClick={sair} aria-label="Sair"><I.Sair /></button>
          </div>
        </div>
      </nav>

      <header className="topo-celular">
        <div className="marca" style={{ padding: 0 }}><img src="/favicon.svg" alt="" style={{ width: 28, height: 28 }} />Organizador</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <BotaoTema />
          <button type="button" className="botao-icone" onClick={sair} aria-label="Sair"><I.Sair /></button>
        </div>
      </header>

      <main className="conteudo">{children}</main>

      <nav className="menu-baixo" aria-label="Menu principal">
        {MENU.map((m) => (
          <NavLink key={m.para} to={m.para} end={m.para === '/'} className={({ isActive }) => (isActive ? 'ativo' : '')}>
            <m.icone />{m.curto}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="login"><p className="dica">Carregando…</p></div>;
  if (!usuario) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  return (
    <Estrutura>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/links" element={<Links />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Estrutura>
  );
}
