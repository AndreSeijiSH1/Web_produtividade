// CRUD de disciplinas, eventos (provas/trabalhos/atividades), links, notas e presets.
const express = require('express');
const db = require('./db');
const { rota, ErroHttp, montarUpdate, exigir, idValido } = require('./util');

const TIPOS = ['prova', 'trabalho', 'atividade'];

// Garante que a disciplina informada é do próprio usuário.
async function checarDisciplina(usuarioId, disciplinaId) {
  if (disciplinaId === undefined || disciplinaId === null || disciplinaId === '') return;
  const { rowCount } = await db.query(
    'SELECT 1 FROM disciplinas WHERE id = $1 AND usuario_id = $2',
    [idValido(disciplinaId), usuarioId]
  );
  if (!rowCount) throw new ErroHttp(400, 'Disciplina não encontrada.');
}

/**
 * Cria um router com GET (lista), GET /:id, POST, PATCH /:id e DELETE /:id
 * para uma tabela simples que pertence ao usuário logado.
 */
function crud({ tabela, campos, obrigatorios, ordem, validar, aoAtualizar = '' }) {
  const r = express.Router();

  r.get('/', rota(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM ${tabela} WHERE usuario_id = $1 ORDER BY ${ordem}`,
      [req.usuarioId]
    );
    res.json(rows);
  }));

  r.get('/:id', rota(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM ${tabela} WHERE id = $1 AND usuario_id = $2`,
      [idValido(req.params.id), req.usuarioId]
    );
    if (!rows[0]) throw new ErroHttp(404, 'Não encontrado.');
    res.json(rows[0]);
  }));

  r.post('/', rota(async (req, res) => {
    exigir(req.body, obrigatorios);
    if (validar) await validar(req.body, req.usuarioId);
    const presentes = campos.filter((c) => req.body[c] !== undefined);
    const valores = presentes.map((c) => (req.body[c] === '' ? null : req.body[c]));
    const cols = ['usuario_id', ...presentes].join(', ');
    const params = ['$1', ...presentes.map((_, i) => `$${i + 2}`)].join(', ');
    const { rows } = await db.query(
      `INSERT INTO ${tabela} (${cols}) VALUES (${params}) RETURNING *`,
      [req.usuarioId, ...valores]
    );
    res.status(201).json(rows[0]);
  }));

  r.patch('/:id', rota(async (req, res) => {
    if (validar) await validar(req.body, req.usuarioId, true);
    const { sets, valores } = montarUpdate(req.body, campos, 3);
    if (!sets.length) throw new ErroHttp(400, 'Nada para atualizar.');
    if (aoAtualizar) sets.push(aoAtualizar);
    const { rows } = await db.query(
      `UPDATE ${tabela} SET ${sets.join(', ')} WHERE id = $1 AND usuario_id = $2 RETURNING *`,
      [idValido(req.params.id), req.usuarioId, ...valores]
    );
    if (!rows[0]) throw new ErroHttp(404, 'Não encontrado.');
    res.json(rows[0]);
  }));

  r.delete('/:id', rota(async (req, res) => {
    const { rowCount } = await db.query(
      `DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`,
      [idValido(req.params.id), req.usuarioId]
    );
    if (!rowCount) throw new ErroHttp(404, 'Não encontrado.');
    res.status(204).end();
  }));

  return r;
}

// ---------- Disciplinas ----------
const disciplinas = crud({
  tabela: 'disciplinas',
  campos: ['nome', 'cor'],
  obrigatorios: ['nome'],
  ordem: 'nome',
});

// ---------- Eventos ----------
const eventosBase = crud({
  tabela: 'eventos',
  campos: ['titulo', 'tipo', 'data', 'observacao', 'concluido', 'disciplina_id'],
  obrigatorios: ['titulo', 'data'],
  ordem: 'data',
  validar: async (corpo, usuarioId) => {
    if (corpo.tipo !== undefined && !TIPOS.includes(corpo.tipo)) {
      throw new ErroHttp(400, 'Tipo deve ser prova, trabalho ou atividade.');
    }
    if (corpo.data !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(corpo.data)) {
      throw new ErroHttp(400, 'Data no formato AAAA-MM-DD.');
    }
    await checarDisciplina(usuarioId, corpo.disciplina_id);
  },
});

// A listagem de eventos é especial: traz o nome da disciplina e aceita filtros.
// GET /api/eventos?status=pendente|concluido&tipo=prova&disciplina_id=3
const eventos = express.Router();
eventos.get('/', rota(async (req, res) => {
  const filtros = ['e.usuario_id = $1'];
  const params = [req.usuarioId];
  const { status, tipo, disciplina_id: disc } = req.query;
  if (status === 'pendente') filtros.push('e.concluido = false');
  if (status === 'concluido') filtros.push('e.concluido = true');
  if (tipo && TIPOS.includes(tipo)) { params.push(tipo); filtros.push(`e.tipo = $${params.length}`); }
  if (disc) { params.push(idValido(disc)); filtros.push(`e.disciplina_id = $${params.length}`); }
  const ordem = status === 'concluido' ? 'e.data DESC' : 'e.data ASC';
  const { rows } = await db.query(
    `SELECT e.*, to_char(e.data, 'YYYY-MM-DD') AS data, d.nome AS disciplina, d.cor AS disciplina_cor
       FROM eventos e LEFT JOIN disciplinas d ON d.id = e.disciplina_id
      WHERE ${filtros.join(' AND ')}
      ORDER BY ${ordem}, e.id`,
    params
  );
  res.json(rows);
}));
eventos.use(eventosBase);

// ---------- Links ----------
const links = crud({
  tabela: 'links',
  campos: ['titulo', 'url', 'categoria'],
  obrigatorios: ['titulo', 'url'],
  ordem: 'categoria, titulo',
  validar: async (corpo) => {
    if (corpo.url !== undefined && !/^https?:\/\//i.test(corpo.url)) {
      throw new ErroHttp(400, 'O link precisa começar com http:// ou https://');
    }
  },
});

// ---------- Notas ----------
const notas = crud({
  tabela: 'notas',
  campos: ['titulo', 'conteudo', 'fixada'],
  obrigatorios: ['titulo'],
  ordem: 'fixada DESC, atualizado_em DESC',
  aoAtualizar: 'atualizado_em = now()',
});

// ---------- Presets do Pomodoro ----------
const presets = crud({
  tabela: 'presets',
  campos: ['nome', 'foco_min', 'pausa_min', 'longa_min'],
  obrigatorios: ['nome', 'foco_min', 'pausa_min', 'longa_min'],
  ordem: 'criado_em',
});

module.exports = { disciplinas, eventos, links, notas, presets };
