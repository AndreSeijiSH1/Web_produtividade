import { Link } from 'react-router-dom';
import { useAuth, usePomodoro } from '../contextos';
import { useDados } from '../useDados';
import { diasAte, curta, partes, hojeExtenso, faltam, duracao } from '../datas';
import * as I from '../Icones';
import { useEffect } from 'react';

const NOME_TIPO = { prova: 'Prova', trabalho: 'Trabalho', atividade: 'Atividade' };

export function iconeDoSite(url) {
  try { return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`; } catch { return ''; }
}

export default function Inicio() {
  const { usuario } = useAuth();
  const { versao } = usePomodoro();
  const pendentes = useDados('/eventos?status=pendente');
  const concluidos = useDados('/eventos?status=concluido');
  const links = useDados('/links');
  const notas = useDados('/notas');
  const resumo = useDados('/estatisticas/resumo', null);
  useEffect(() => { resumo.recarregar(); }, [versao]); // eslint-disable-line react-hooks/exhaustive-deps

  const lista = pendentes.dados.map((e) => ({ ...e, dias: diasAte(e.data) }));
  const futuros = lista.filter((e) => e.dias >= 0);
  const atrasados = lista.filter((e) => e.dias < 0);
  const proximaProva = futuros.find((e) => e.tipo === 'prova') || futuros[0];
  const emBreve = futuros.filter((e) => e.dias <= 3);
  const em14 = futuros.filter((e) => e.dias <= 14).length;
  const notaFixada = notas.dados.find((n) => n.fixada);
  const primeiroNome = (usuario.nome || '').split(' ')[0];

  return (
    <>
      <header className="cabecalho">
        <div>
          <p className="sub">{hojeExtenso()}</p>
          <h1>Olá, {primeiroNome}</h1>
        </div>
        <Link to="/agenda?novo=1" className="botao primario"><I.Mais />Novo</Link>
      </header>

      {pendentes.erro && <p className="erro" role="alert">{pendentes.erro}</p>}

      {(emBreve.length > 0 || atrasados.length > 0) && (
        <div className="alerta" role="status">
          <I.Alerta />
          <div>
            {emBreve.map((e) => (
              <div key={e.id}><strong>{NOME_TIPO[e.tipo]} {faltam(e.dias)}:</strong> {e.disciplina ? `${e.disciplina} — ` : ''}{e.titulo}</div>
            ))}
            {atrasados.length > 0 && (
              <div>{atrasados.length === 1 ? '1 item passou da data' : `${atrasados.length} itens passaram da data`} e ainda não foi marcado como concluído. <Link to="/agenda">Ver agenda</Link></div>
            )}
          </div>
        </div>
      )}

      {proximaProva ? (
        <section className="cartao destaque" aria-label="Destaque">
          <div>
            <span className="rotulo">Próxim{proximaProva.tipo === 'prova' ? 'a prova' : 'o item'}</span>
            <p className="titulo">{proximaProva.disciplina ? `${proximaProva.disciplina} — ` : ''}{proximaProva.titulo}</p>
            <p className="dica">{curta(proximaProva.data)}{proximaProva.observacao ? ` · ${proximaProva.observacao}` : ''}</p>
          </div>
          <div className="contador">
            {proximaProva.dias === 0 ? <strong style={{ fontSize: 26 }}>Hoje</strong> : (<><strong>{proximaProva.dias}</strong><span>{proximaProva.dias === 1 ? 'dia' : 'dias'}</span></>)}
          </div>
        </section>
      ) : !pendentes.carregando && (
        <section className="cartao destaque"><div><span className="rotulo">Tudo em dia</span><p className="titulo">Nenhuma prova ou entrega pela frente</p><p className="dica">Cadastre a próxima na <Link to="/agenda?novo=1">agenda</Link>.</p></div></section>
      )}

      <section className="numeros" aria-label="Resumo">
        <div className="cartao numero"><span>Pendentes</span><strong>{futuros.length}</strong></div>
        <div className="cartao numero"><span>Próximos 14 dias</span><strong>{em14}</strong></div>
        <div className="cartao numero"><span>Concluídos</span><strong>{concluidos.dados.length}</strong></div>
        <div className="cartao numero"><span>Estudado hoje</span><strong>{resumo.dados ? duracao(resumo.dados.hoje) : '—'}</strong></div>
      </section>

      <div className="grade-2">
        <section className="cartao" aria-labelledby="t-prox">
          <div className="cartao-titulo"><h2 id="t-prox">Próximas provas e entregas</h2><Link to="/agenda" style={{ fontSize: 13 }}>Ver agenda</Link></div>
          {futuros.length === 0 && !pendentes.carregando && <p className="vazio">Nada pendente.</p>}
          {futuros.slice(0, 6).map((e) => {
            const p = partes(e.data);
            return (
              <div className="item-evento" key={e.id}>
                <div className="data-bloco"><strong>{p.dia}</strong><span>{p.mes} · {p.semana}</span></div>
                <div className="meio"><strong>{e.disciplina || e.titulo}</strong><span>{NOME_TIPO[e.tipo]}{e.disciplina ? ` · ${e.titulo}` : ''}</span></div>
                <span className="selo pendente">{faltam(e.dias)}</span>
              </div>
            );
          })}
        </section>

        <div className="coluna">
          <section className="cartao" aria-labelledby="t-links">
            <div className="cartao-titulo"><h2 id="t-links">Links rápidos</h2><Link to="/links" style={{ fontSize: 13 }}>Todos</Link></div>
            {links.dados.length === 0 && !links.carregando && <p className="dica">Nenhum link ainda. <Link to="/links">Adicionar</Link></p>}
            {links.dados.slice(0, 5).map((l) => (
              <a key={l.id} className="link-rapido" href={l.url} target="_blank" rel="noreferrer">
                <img src={iconeDoSite(l.url)} alt="" onError={(ev) => { ev.currentTarget.style.visibility = 'hidden'; }} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.titulo}</span>
                <I.Externo />
              </a>
            ))}
          </section>

          <section className="cartao nota fixada" aria-labelledby="t-nota" style={{ cursor: 'default', minHeight: 0 }}>
            <h2 id="t-nota">{notaFixada ? notaFixada.titulo : 'Anotação fixada'}</h2>
            <p className="texto">{notaFixada ? notaFixada.conteudo : 'Fixe uma anotação (como sua rotina da semana) para ela aparecer aqui.'}</p>
            <Link to="/notas" style={{ fontSize: 13 }}>Abrir anotações</Link>
          </section>
        </div>
      </div>
    </>
  );
}
