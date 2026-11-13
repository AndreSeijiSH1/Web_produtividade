import { useState } from 'react';
import { api } from '../api';
import { useDados } from '../useDados';
import Modal from '../Modal';
import * as I from '../Icones';

function FormNota({ nota, aoSalvar, aoFechar }) {
  const [f, setF] = useState(nota ? { titulo: nota.titulo, conteudo: nota.conteudo, fixada: nota.fixada } : { titulo: '', conteudo: '', fixada: false });
  const [erro, setErro] = useState('');
  const salvar = async (e) => {
    e.preventDefault();
    try {
      if (nota) await api.patch(`/notas/${nota.id}`, f);
      else await api.post('/notas', f);
      aoSalvar();
    } catch (err) { setErro(err.message); }
  };
  const apagar = async () => {
    if (!window.confirm(`Apagar a anotação "${nota.titulo}"?`)) return;
    try { await api.del(`/notas/${nota.id}`); aoSalvar(); } catch (err) { setErro(err.message); }
  };
  return (
    <Modal titulo={nota ? 'Editar anotação' : 'Nova anotação'} aoFechar={aoFechar}>
      <form className="form" onSubmit={salvar}>
        <label className="campo">Título<input required placeholder="Ex.: Rotina semanal" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label className="campo">Texto<textarea rows="10" value={f.conteudo} onChange={(e) => setF({ ...f, conteudo: e.target.value })} placeholder={'seg — academia 7h, aula 19h\nter — …'} /></label>
        <label className="checkbox"><input type="checkbox" checked={f.fixada} onChange={(e) => setF({ ...f, fixada: e.target.checked })} />Fixar no topo e no Início</label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="botoes">
          {nota && <button type="button" className="botao perigo esquerda" onClick={apagar}><I.Lixo />Apagar</button>}
          <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao primario">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

const quando = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Notas() {
  const notas = useDados('/notas');
  const [aberta, setAberta] = useState(null);

  return (
    <>
      <header className="cabecalho">
        <h1>Anotações</h1>
        <button type="button" className="botao primario" onClick={() => setAberta('nova')}><I.Mais />Nova anotação</button>
      </header>
      {notas.erro && <p className="erro" role="alert">{notas.erro}</p>}
      <div className="grade-cartoes">
        {notas.dados.map((n) => (
          <button key={n.id} type="button" className={`cartao nota${n.fixada ? ' fixada' : ''}`} onClick={() => setAberta(n)}>
            <strong style={{ fontSize: 15 }}>{n.titulo}</strong>
            <p className="texto">{n.conteudo}</p>
            <div className="rodape">
              <span>Editada em {quando(n.atualizado_em)}</span>
              {n.fixada && <span className="selo-fixada"><I.Pino />Fixada</span>}
            </div>
          </button>
        ))}
        <button type="button" className="cartao-novo" onClick={() => setAberta('nova')}>+ Nova anotação</button>
      </div>
      {aberta && (
        <FormNota
          nota={aberta === 'nova' ? null : aberta}
          aoFechar={() => setAberta(null)}
          aoSalvar={() => { setAberta(null); notas.recarregar(); }}
        />
      )}
    </>
  );
}
