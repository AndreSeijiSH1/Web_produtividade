import { useState } from 'react';
import { api } from '../api';
import { useDados } from '../useDados';
import Modal from '../Modal';
import * as I from '../Icones';
import { iconeDoSite } from './Inicio';

const CATEGORIAS_PADRAO = ['Faculdade', 'Ferramentas', 'Pessoal'];

function FormLink({ link, categorias, aoSalvar, aoFechar }) {
  const [f, setF] = useState(link || { titulo: '', url: '', categoria: 'Faculdade' });
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState('');
  const salvar = async (e) => {
    e.preventDefault();
    let url = f.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    const corpo = { titulo: f.titulo, url, categoria: f.categoria === '__nova' ? nova.trim() || 'Outros' : f.categoria };
    try {
      if (link) await api.patch(`/links/${link.id}`, corpo);
      else await api.post('/links', corpo);
      aoSalvar();
    } catch (err) { setErro(err.message); }
  };
  const apagar = async () => {
    if (!window.confirm(`Apagar o link "${link.titulo}"?`)) return;
    try { await api.del(`/links/${link.id}`); aoSalvar(); } catch (err) { setErro(err.message); }
  };
  return (
    <Modal titulo={link ? 'Editar link' : 'Adicionar link'} aoFechar={aoFechar}>
      <form className="form" onSubmit={salvar}>
        <label className="campo">Nome<input required placeholder="Ex.: Apostila Módulo 5" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label className="campo">Endereço (URL)<input required inputMode="url" placeholder="https://" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
        <label className="campo">Categoria
          <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__nova">+ Nova categoria…</option>
          </select>
        </label>
        {f.categoria === '__nova' && <label className="campo">Nome da categoria<input value={nova} onChange={(e) => setNova(e.target.value)} /></label>}
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="botoes">
          {link && <button type="button" className="botao perigo esquerda" onClick={apagar}><I.Lixo />Apagar</button>}
          <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao primario">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Links() {
  const links = useDados('/links');
  const [filtro, setFiltro] = useState('');
  const [aberto, setAberto] = useState(null); // null | 'novo' | link
  const categorias = [...new Set([...CATEGORIAS_PADRAO, ...links.dados.map((l) => l.categoria)])];
  const visiveis = filtro ? links.dados.filter((l) => l.categoria === filtro) : links.dados;

  return (
    <>
      <header className="cabecalho">
        <h1>Links importantes</h1>
        <button type="button" className="botao primario" onClick={() => setAberto('novo')}><I.Mais />Adicionar link</button>
      </header>
      <div className="chips" role="group" aria-label="Filtrar por categoria">
        <button type="button" className="chip" aria-pressed={filtro === ''} onClick={() => setFiltro('')}>Todos</button>
        {categorias.map((c) => <button key={c} type="button" className="chip" aria-pressed={filtro === c} onClick={() => setFiltro(c)}>{c}</button>)}
      </div>
      {links.erro && <p className="erro" role="alert">{links.erro}</p>}
      <div className="grade-cartoes">
        {visiveis.map((l) => (
          <div key={l.id} className="cartao" style={{ position: 'relative', padding: 0 }}>
            <a className="cartao-link" href={l.url} target="_blank" rel="noreferrer" style={{ padding: 18, border: 0 }}>
              <div className="topo">
                <span className="favicon"><img src={iconeDoSite(l.url)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /></span>
                <span className="selo neutro">{l.categoria}</span>
              </div>
              <strong style={{ fontSize: 15, paddingRight: 36 }}>{l.titulo}</strong>
              <span className="url">{l.url.replace(/^https?:\/\//, '')}</span>
            </a>
            <div className="acoes-canto">
              <button type="button" className="botao-icone" onClick={() => setAberto(l)} aria-label={`Editar ${l.titulo}`}><I.Lapis /></button>
            </div>
          </div>
        ))}
        <button type="button" className="cartao-novo" style={{ minHeight: 140 }} onClick={() => setAberto('novo')}>+ Adicionar link</button>
      </div>
      {aberto && (
        <FormLink
          link={aberto === 'novo' ? null : aberto}
          categorias={categorias}
          aoFechar={() => setAberto(null)}
          aoSalvar={() => { setAberto(null); links.recarregar(); }}
        />
      )}
    </>
  );
}
