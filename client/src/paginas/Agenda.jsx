import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useDados } from '../useDados';
import { curta, diasAte, faltam, hojeTexto } from '../datas';
import Modal from '../Modal';
import * as I from '../Icones';

const TIPOS = [['prova', 'Prova'], ['trabalho', 'Trabalho'], ['atividade', 'Atividade']];
const NOME_TIPO = Object.fromEntries(TIPOS);
const VAZIO = { titulo: '', disciplina_id: '', tipo: 'prova', data: '', observacao: '' };

function Disciplinas({ lista, aoMudar, aoFechar }) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const adicionar = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    try { await api.post('/disciplinas', { nome: nome.trim() }); setNome(''); setErro(''); aoMudar(); } catch (err) { setErro(err.message); }
  };
  const remover = async (d) => {
    if (!window.confirm(`Apagar a disciplina "${d.nome}"? Os itens dela continuam, só ficam sem disciplina.`)) return;
    try { await api.del(`/disciplinas/${d.id}`); aoMudar(); } catch (err) { setErro(err.message); }
  };
  return (
    <Modal titulo="Disciplinas" aoFechar={aoFechar}>
      <form className="form" onSubmit={adicionar}>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="campo" style={{ flex: 1 }}><span className="sr">Nova disciplina</span>
            <input placeholder="Ex.: Banco de Dados" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <button className="botao primario" type="submit">Adicionar</button>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
      </form>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {lista.map((d) => (
          <li key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--divisor)' }}>
            {d.nome}
            <button type="button" className="botao-icone perigo" onClick={() => remover(d)} aria-label={`Apagar ${d.nome}`}><I.Lixo /></button>
          </li>
        ))}
        {lista.length === 0 && <li className="dica">Nenhuma disciplina ainda.</li>}
      </ul>
      <div className="botoes"><button type="button" className="botao" onClick={aoFechar}>Fechar</button></div>
    </Modal>
  );
}

export default function Agenda() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('pendente');
  const [filtroDisc, setFiltroDisc] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [verDisciplinas, setVerDisciplinas] = useState(false);
  const tituloRef = useRef(null);

  const disciplinas = useDados('/disciplinas');
  const q = new URLSearchParams();
  if (status !== 'todos') q.set('status', status);
  if (filtroDisc) q.set('disciplina_id', filtroDisc);
  if (filtroTipo) q.set('tipo', filtroTipo);
  const eventos = useDados(`/eventos?${q.toString()}`);
  const contagem = useDados('/eventos');
  const pend = contagem.dados.filter((e) => !e.concluido).length;
  const conc = contagem.dados.length - pend;

  useEffect(() => {
    if (params.get('novo')) { tituloRef.current?.focus(); setParams({}, { replace: true }); }
  }, [params, setParams]);

  const recarregar = () => { eventos.recarregar(); contagem.recarregar(); };

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    const corpo = { ...form, disciplina_id: form.disciplina_id ? Number(form.disciplina_id) : null };
    try {
      if (editando) await api.patch(`/eventos/${editando}`, corpo);
      else await api.post('/eventos', corpo);
      setForm(VAZIO); setEditando(null); recarregar();
    } catch (err) { setErro(err.message); }
    setSalvando(false);
  };

  const editar = (ev) => {
    setEditando(ev.id);
    setForm({ titulo: ev.titulo, disciplina_id: ev.disciplina_id || '', tipo: ev.tipo, data: ev.data, observacao: ev.observacao || '' });
    tituloRef.current?.focus();
  };

  const alternar = async (ev) => {
    eventos.setDados((l) => l.map((x) => (x.id === ev.id ? { ...x, concluido: !ev.concluido } : x)));
    try { await api.patch(`/eventos/${ev.id}`, { concluido: !ev.concluido }); } catch (err) { setErro(err.message); }
    recarregar();
  };

  const apagar = async (ev) => {
    if (!window.confirm(`Apagar "${ev.titulo}"?`)) return;
    try { await api.del(`/eventos/${ev.id}`); recarregar(); } catch (err) { setErro(err.message); }
  };

  const primeiroFuturo = eventos.dados.find((e) => !e.concluido && diasAte(e.data) >= 0)?.id;
  const muda = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <>
      <header className="cabecalho"><h1>Agenda</h1></header>

      <div className="grade-2">
        <section className="coluna" aria-label="Lista de provas e entregas" style={{ gap: 16 }}>
          <div className="filtros">
            <div className="abas" role="tablist" aria-label="Situação">
              {[['pendente', `Próximas (${pend})`], ['concluido', `Concluídas (${conc})`], ['todos', 'Todas']].map(([v, t]) => (
                <button key={v} type="button" role="tab" aria-selected={status === v} onClick={() => setStatus(v)}>{t}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label className="filtro">Disciplina
                <select value={filtroDisc} onChange={(e) => setFiltroDisc(e.target.value)}>
                  <option value="">Todas</option>
                  {disciplinas.dados.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </label>
              <label className="filtro">Tipo
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                  <option value="">Todos</option>
                  {TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </label>
            </div>
          </div>

          {(eventos.erro || erro) && <p className="erro" role="alert">{eventos.erro || erro}</p>}

          <div className="cartao tabela-caixa">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}><span className="sr">Concluído</span></th>
                  <th>Data</th><th>Disciplina / item</th><th>Tipo</th><th>Faltam</th>
                  <th><span className="sr">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {eventos.dados.map((ev) => {
                  const n = diasAte(ev.data);
                  return (
                    <tr key={ev.id} className={`${ev.concluido ? 'feito' : ''} ${ev.id === primeiroFuturo ? 'proximo' : ''}`}>
                      <td><input type="checkbox" checked={ev.concluido} onChange={() => alternar(ev)} aria-label={`Marcar "${ev.titulo}" como ${ev.concluido ? 'pendente' : 'concluído'}`} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{curta(ev.data)}</td>
                      <td>
                        <span className="titulo-evento">{ev.disciplina || ev.titulo}</span>
                        {ev.disciplina && <span className="obs">{ev.titulo}</span>}
                        {ev.observacao && <span className="obs">{ev.observacao}</span>}
                      </td>
                      <td><span className="selo tipo">{NOME_TIPO[ev.tipo]}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {ev.concluido ? <span className="selo ok">Feito</span>
                          : <span style={{ fontWeight: n <= 3 ? 600 : 400, color: n < 0 ? 'var(--perigo)' : n <= 3 ? 'var(--primaria-texto)' : 'var(--texto-3)' }}>{faltam(n)}</span>}
                      </td>
                      <td>
                        <div className="acoes">
                          <button type="button" className="botao-icone" onClick={() => editar(ev)} aria-label={`Editar ${ev.titulo}`}><I.Lapis /></button>
                          <button type="button" className="botao-icone perigo" onClick={() => apagar(ev)} aria-label={`Apagar ${ev.titulo}`}><I.Lixo /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {eventos.dados.length === 0 && !eventos.carregando && <p className="vazio">Nada por aqui.</p>}
          </div>
          <p className="dica">Marcar a caixa move o item para "Concluídas".</p>
        </section>

        <aside className="cartao" aria-labelledby="t-form">
          <form className="form" onSubmit={salvar}>
            <h2 id="t-form" style={{ fontSize: 18 }}>{editando ? 'Editar item' : 'Novo item'}</h2>
            <label className="campo">Título
              <input ref={tituloRef} required placeholder="Ex.: Prova PO" value={form.titulo} onChange={muda('titulo')} />
            </label>
            <label className="campo">Disciplina
              <select value={form.disciplina_id} onChange={muda('disciplina_id')}>
                <option value="">Sem disciplina</option>
                {disciplinas.dados.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </label>
            <button type="button" className="botao" style={{ minHeight: 36, alignSelf: 'flex-start', fontSize: 13 }} onClick={() => setVerDisciplinas(true)}>Gerenciar disciplinas</button>
            <div className="campo-linha">
              <label className="campo">Tipo
                <select value={form.tipo} onChange={muda('tipo')}>{TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
              </label>
              <label className="campo">Data
                <input type="date" required value={form.data} min={editando ? undefined : hojeTexto()} onChange={muda('data')} />
              </label>
            </div>
            <label className="campo">Observação
              <textarea rows="3" placeholder="Conteúdo da prova, sala, o que levar…" value={form.observacao} onChange={muda('observacao')} />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {editando && <button type="button" className="botao" onClick={() => { setEditando(null); setForm(VAZIO); }}>Cancelar</button>}
              <button className="botao primario" type="submit" disabled={salvando} style={{ flex: 1 }}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </aside>
      </div>

      {verDisciplinas && <Disciplinas lista={disciplinas.dados} aoMudar={() => { disciplinas.recarregar(); eventos.recarregar(); }} aoFechar={() => setVerDisciplinas(false)} />}
    </>
  );
}
