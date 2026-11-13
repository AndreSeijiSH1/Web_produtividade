import { useEffect, useState } from 'react';
import { api } from '../api';
import { usePomodoro, CICLOS_ATE_LONGA } from '../contextos';
import { useDados } from '../useDados';
import { MESES, duracao, hora, paraTexto, hojeTexto } from '../datas';
import Modal from '../Modal';
import * as I from '../Icones';

const CIRC = 2 * Math.PI * 130;

function FormPreset({ aoSalvar, aoFechar }) {
  const [f, setF] = useState({ nome: '', foco_min: 30, pausa_min: 5, longa_min: 15 });
  const [erro, setErro] = useState('');
  const num = (c) => (e) => setF({ ...f, [c]: e.target.value === '' ? '' : Number(e.target.value) });
  const salvar = async (e) => {
    e.preventDefault();
    try { const p = await api.post('/presets', f); aoSalvar(p); } catch (err) { setErro(err.message); }
  };
  return (
    <Modal titulo="Novo pré-set" aoFechar={aoFechar}>
      <form className="form" onSubmit={salvar}>
        <label className="campo">Nome<input required placeholder="Ex.: Revisão" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
        <div className="campo-linha" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <label className="campo">Foco (min)<input type="number" min="1" max="240" required value={f.foco_min} onChange={num('foco_min')} /></label>
          <label className="campo">Pausa (min)<input type="number" min="1" max="120" required value={f.pausa_min} onChange={num('pausa_min')} /></label>
          <label className="campo">Longa (min)<input type="number" min="1" max="120" required value={f.longa_min} onChange={num('longa_min')} /></label>
        </div>
        <p className="dica">A pausa longa vem a cada {CICLOS_ATE_LONGA} ciclos de foco.</p>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="botoes">
          <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao primario">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function nivel(seg) {
  const m = seg / 60;
  if (m <= 0) return 0;
  if (m < 30) return 1;
  if (m < 60) return 2;
  if (m < 120) return 3;
  return 4;
}

function MapaAno({ ano, dias }) {
  const porDia = Object.fromEntries(dias.map((d) => [d.dia, d.segundos]));
  const inicio = new Date(ano, 0, 1);
  const deslocamento = inicio.getDay(); // semanas começam no domingo
  const hoje = hojeTexto();
  const celulas = [];
  for (let i = 0; i < deslocamento; i++) celulas.push(<span key={`f${i}`} className="fora" />);
  for (let dt = new Date(inicio); dt.getFullYear() === ano; dt.setDate(dt.getDate() + 1)) {
    const k = paraTexto(dt);
    const seg = porDia[k] || 0;
    const rot = `${dt.getDate()}/${dt.getMonth() + 1}: ${seg ? duracao(seg) : 'sem estudo'}`;
    celulas.push(<span key={k} className={`n${nivel(seg)}${k === hoje ? ' hoje' : ''}`} title={rot} />);
  }
  const rotulosMes = MESES.map((m, i) => {
    const primeiro = new Date(ano, i, 1);
    const idx = deslocamento + Math.round((primeiro - inicio) / 86400000);
    return <span key={m} style={{ left: Math.floor(idx / 7) * 15 }}>{m}</span>;
  });
  return (
    <div className="mapa-caixa">
      <div className="mapa" role="img" aria-label={`Mapa de estudo de ${ano}: cada quadrado é um dia, mais escuro significa mais tempo estudado`}>
        <div className="mapa-meses" aria-hidden="true">{rotulosMes}</div>
        <div className="mapa-grade" aria-hidden="true">{celulas}</div>
      </div>
    </div>
  );
}

export default function Pomodoro() {
  const p = usePomodoro();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [novoPreset, setNovoPreset] = useState(false);
  const disciplinas = useDados('/disciplinas');
  const resumo = useDados('/estatisticas/resumo', null);
  const sessoes = useDados('/sessoes');
  const mapa = useDados(`/estatisticas/mapa?ano=${ano}`);
  const mensal = useDados(`/estatisticas/mensal?ano=${ano}`);
  const porDisc = useDados(`/estatisticas/disciplinas?ano=${ano}`);

  useEffect(() => {
    if (p.versao === 0) return;
    [resumo, sessoes, mapa, mensal, porDisc].forEach((d) => d.recarregar());
  }, [p.versao]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(p.restante / 60)).padStart(2, '0');
  const ss = String(p.restante % 60).padStart(2, '0');
  const progresso = p.total ? 1 - p.restante / p.total : 0;
  const faseNome = p.fase === 'foco' ? 'Foco' : p.fase === 'pausa' ? 'Pausa curta' : 'Pausa longa';
  const maxMes = Math.max(1, ...mensal.dados.map((m) => m.segundos));
  const maxDisc = Math.max(1, ...porDisc.dados.map((d) => d.segundos));
  const totalAno = mensal.dados.reduce((s, m) => s + m.segundos, 0);
  const aoVivo = p.focoEmAndamento;

  const apagarPreset = async (pr) => {
    if (!window.confirm(`Apagar o pré-set "${pr.nome}"?`)) return;
    try {
      await api.del(`/presets/${pr.dbId}`);
      if (p.presetId === pr.id) p.escolherPreset('classico');
      p.recarregarPresets();
    } catch (err) { window.alert(err.message); }
  };

  return (
    <>
      <header className="cabecalho">
        <h1>Pomodoro</h1>
        <label className="filtro">Estudando
          <select value={p.disciplinaId} onChange={(e) => p.escolherDisciplina(e.target.value)}>
            <option value="">Sem disciplina</option>
            {disciplinas.dados.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </label>
      </header>

      <div className="pomo-topo">
        <section className="cartao timer-cartao" aria-label="Timer">
          <div className="chips" role="group" aria-label="Pré-sets de tempo" style={{ justifyContent: 'center' }}>
            {p.presets.map((pr) => (
              <span key={pr.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button type="button" className="chip" aria-pressed={p.presetId === pr.id} onClick={() => p.escolherPreset(pr.id)}>
                  {pr.nome} · {pr.foco}/{pr.pausa}
                </button>
                {pr.personalizado && (
                  <button type="button" className="botao-icone perigo" style={{ width: 32, height: 32 }} onClick={() => apagarPreset(pr)} aria-label={`Apagar pré-set ${pr.nome}`}><I.Lixo /></button>
                )}
              </span>
            ))}
            <button type="button" className="chip tracejado" onClick={() => setNovoPreset(true)}>+ Personalizado</button>
          </div>

          <div className="anel">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <circle cx="150" cy="150" r="130" fill="none" stroke="var(--divisor)" strokeWidth="14" />
              <circle cx="150" cy="150" r="130" fill="none" stroke={p.fase === 'foco' ? 'var(--primaria-texto)' : 'var(--ok-texto)'}
                strokeWidth="14" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * progresso}
                style={{ transition: 'stroke-dashoffset .3s linear' }} />
            </svg>
            <div className="meio">
              <span className="rotulo" style={{ color: p.fase === 'foco' ? 'var(--primaria-texto)' : 'var(--ok-texto)' }}>{faseNome}</span>
              <span className="tempo" role="timer" aria-label={`${faseNome}: faltam ${mm} minutos e ${ss} segundos`}>{mm}:{ss}</span>
              <span className="ciclo">Ciclo {p.ciclo} de {CICLOS_ATE_LONGA}</span>
            </div>
          </div>

          <div className="controles">
            <button type="button" className="botao" onClick={p.reiniciar}>Reiniciar</button>
            {p.rodando
              ? <button type="button" className="botao primario principal" onClick={p.pausar}>Pausar</button>
              : <button type="button" className="botao primario principal" onClick={p.iniciar}>{p.restante < p.total ? 'Continuar' : 'Iniciar'}</button>}
            <button type="button" className="botao" onClick={p.pular}>Pular</button>
          </div>
          <p className="dica" style={{ textAlign: 'center' }}>
            Pausa longa a cada {CICLOS_ATE_LONGA} ciclos. Cada foco concluído é salvo; se você reiniciar ou pular no meio, o tempo já estudado também conta.
          </p>
        </section>

        <aside className="lado">
          <div className="cartao numero"><span>Estudado hoje</span><strong>{resumo.dados ? duracao(resumo.dados.hoje + aoVivo) : '—'}</strong></div>
          <div className="cartao numero"><span>Neste mês</span><strong>{resumo.dados ? duracao(resumo.dados.mes + aoVivo) : '—'}</strong></div>
          <div className="cartao numero"><span>Total desde o início</span><strong>{resumo.dados ? duracao(resumo.dados.total + aoVivo) : '—'}</strong></div>
          <div className="cartao">
            <h2 style={{ fontSize: 13, color: 'var(--texto-3)', fontWeight: 500 }}>Sessões de hoje</h2>
            {sessoes.dados.length === 0
              ? <p className="dica" style={{ marginTop: 8 }}>Nenhuma ainda.</p>
              : (
                <ul className="lista-sessoes">
                  {sessoes.dados.map((s) => (
                    <li key={s.id}><span>{hora(s.inicio)} · {s.disciplina || 'Sem disciplina'}</span><span>{duracao(s.duracao_seg)}{s.completa ? '' : '*'}</span></li>
                  ))}
                </ul>
              )}
            {sessoes.dados.some((s) => !s.completa) && <p className="dica" style={{ marginTop: 6, fontSize: 12 }}>* interrompida</p>}
          </div>
        </aside>
      </div>

      <section className="cartao" aria-labelledby="t-mapa">
        <div className="cartao-titulo" style={{ marginBottom: 14 }}>
          <h2 id="t-mapa">Mapa de estudo</h2>
          <div className="seletor-ano">
            <button type="button" className="botao-icone" onClick={() => setAno(ano - 1)} aria-label="Ano anterior"><I.Esquerda /></button>
            <span>{ano}</span>
            <button type="button" className="botao-icone" onClick={() => setAno(ano + 1)} aria-label="Próximo ano" disabled={ano >= new Date().getFullYear()}><I.Direita /></button>
          </div>
        </div>
        <MapaAno ano={ano} dias={mapa.dados} />
        <div className="legenda" aria-hidden="true">
          Menos
          {[0, 1, 2, 3, 4].map((n) => <span key={n} className="q" style={{ background: `var(--mapa-${n})` }} />)}
          Mais <span style={{ marginLeft: 8 }}>(até 30min, 1h, 2h, mais de 2h)</span>
        </div>
      </section>

      <div className="grade-2">
        <section className="cartao" aria-labelledby="t-mensal">
          <div className="cartao-titulo"><h2 id="t-mensal">Horas por mês · {ano}</h2><span className="dica">Total: {duracao(totalAno)}</span></div>
          <div className="barras">
            {mensal.dados.map((m) => (
              <div className="barra" key={m.mes}>
                <span className="valor">{m.segundos ? `${Math.round(m.segundos / 360) / 10}h` : ''}</span>
                <div className="coluna-barra" style={{ height: `${(m.segundos / maxMes) * 82}%` }} title={`${MESES[m.mes - 1]}: ${duracao(m.segundos)}`} />
                <span className="mes">{MESES[m.mes - 1]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="cartao" aria-labelledby="t-disc">
          <h2 id="t-disc">Por disciplina · {ano}</h2>
          {porDisc.dados.length === 0 && <p className="dica" style={{ marginTop: 8 }}>Sem sessões neste ano.</p>}
          <div className="por-disciplina">
            {porDisc.dados.map((d) => (
              <div className="linha" key={d.disciplina}>
                <span>{d.disciplina}</span><span className="dica">{duracao(d.segundos)}</span>
                <div className="trilho"><div style={{ width: `${(d.segundos / maxDisc) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {novoPreset && (
        <FormPreset
          aoFechar={() => setNovoPreset(false)}
          aoSalvar={(pr) => { setNovoPreset(false); p.recarregarPresets(); p.escolherPreset(`c-${pr.id}`, { foco: pr.foco_min }); }}
        />
      )}
    </>
  );
}
