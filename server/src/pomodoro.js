// Sessões de estudo do Pomodoro e estatísticas (resumo, mapa do ano, horas por mês).
const express = require('express');
const db = require('./db');
const { rota, ErroHttp, idValido } = require('./util');

// Fuso usado para decidir "que dia" cada sessão conta.
const FUSO = process.env.APP_TZ || 'America/Sao_Paulo';

// ---------- Sessões ----------
const sessoes = express.Router();

// POST /api/sessoes  { inicio, duracao_seg, disciplina_id?, completa? }
sessoes.post('/', rota(async (req, res) => {
  const { inicio, duracao_seg: duracao, disciplina_id: disc, completa = true } = req.body;
  const dataInicio = new Date(inicio);
  if (!inicio || Number.isNaN(dataInicio.getTime())) throw new ErroHttp(400, 'Início inválido.');
  const seg = Math.round(Number(duracao));
  if (!Number.isFinite(seg) || seg < 1 || seg > 86400) throw new ErroHttp(400, 'Duração inválida.');
  let discId = null;
  if (disc !== undefined && disc !== null && disc !== '') {
    discId = idValido(disc);
    const { rowCount } = await db.query(
      'SELECT 1 FROM disciplinas WHERE id = $1 AND usuario_id = $2', [discId, req.usuarioId]
    );
    if (!rowCount) throw new ErroHttp(400, 'Disciplina não encontrada.');
  }
  const { rows } = await db.query(
    `INSERT INTO sessoes_estudo (usuario_id, disciplina_id, inicio, duracao_seg, completa)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.usuarioId, discId, dataInicio.toISOString(), seg, Boolean(completa)]
  );
  res.status(201).json(rows[0]);
}));

// GET /api/sessoes?dia=AAAA-MM-DD  (padrão: hoje)
sessoes.get('/', rota(async (req, res) => {
  const dia = req.query.dia;
  if (dia && !/^\d{4}-\d{2}-\d{2}$/.test(dia)) throw new ErroHttp(400, 'Dia no formato AAAA-MM-DD.');
  const { rows } = await db.query(
    `SELECT s.*, d.nome AS disciplina
       FROM sessoes_estudo s LEFT JOIN disciplinas d ON d.id = s.disciplina_id
      WHERE s.usuario_id = $1
        AND (s.inicio AT TIME ZONE $2)::date = COALESCE($3::date, (now() AT TIME ZONE $2)::date)
      ORDER BY s.inicio DESC`,
    [req.usuarioId, FUSO, dia || null]
  );
  res.json(rows);
}));

sessoes.delete('/:id', rota(async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM sessoes_estudo WHERE id = $1 AND usuario_id = $2',
    [idValido(req.params.id), req.usuarioId]
  );
  if (!rowCount) throw new ErroHttp(404, 'Não encontrado.');
  res.status(204).end();
}));

// ---------- Estatísticas ----------
const estatisticas = express.Router();

// GET /api/estatisticas/resumo -> segundos estudados hoje, no mês e no total
estatisticas.get('/resumo', rota(async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM(duracao_seg) FILTER (
         WHERE (inicio AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date), 0)::int AS hoje,
       COALESCE(SUM(duracao_seg) FILTER (
         WHERE date_trunc('month', inicio AT TIME ZONE $2) = date_trunc('month', now() AT TIME ZONE $2)), 0)::int AS mes,
       COALESCE(SUM(duracao_seg), 0)::int AS total
     FROM sessoes_estudo WHERE usuario_id = $1`,
    [req.usuarioId, FUSO]
  );
  res.json(rows[0]);
}));

function anoDaQuery(req) {
  const ano = Number(req.query.ano || new Date().getFullYear());
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) throw new ErroHttp(400, 'Ano inválido.');
  return ano;
}

// GET /api/estatisticas/mapa?ano=2026 -> [{ dia: '2026-11-13', segundos: 3000 }, ...]
estatisticas.get('/mapa', rota(async (req, res) => {
  const { rows } = await db.query(
    `SELECT to_char((inicio AT TIME ZONE $2)::date, 'YYYY-MM-DD') AS dia,
            SUM(duracao_seg)::int AS segundos
       FROM sessoes_estudo
      WHERE usuario_id = $1 AND EXTRACT(YEAR FROM inicio AT TIME ZONE $2) = $3
      GROUP BY 1 ORDER BY 1`,
    [req.usuarioId, FUSO, anoDaQuery(req)]
  );
  res.json(rows);
}));

// GET /api/estatisticas/mensal?ano=2026 -> 12 meses, mesmo os zerados
estatisticas.get('/mensal', rota(async (req, res) => {
  const { rows } = await db.query(
    `SELECT m AS mes, COALESCE(SUM(s.duracao_seg), 0)::int AS segundos
       FROM generate_series(1, 12) AS m
       LEFT JOIN sessoes_estudo s
         ON s.usuario_id = $1
        AND EXTRACT(YEAR FROM s.inicio AT TIME ZONE $2) = $3
        AND EXTRACT(MONTH FROM s.inicio AT TIME ZONE $2) = m
      GROUP BY m ORDER BY m`,
    [req.usuarioId, FUSO, anoDaQuery(req)]
  );
  res.json(rows);
}));

// GET /api/estatisticas/disciplinas?ano=2026 -> tempo por disciplina no ano
estatisticas.get('/disciplinas', rota(async (req, res) => {
  const { rows } = await db.query(
    `SELECT COALESCE(d.nome, 'Sem disciplina') AS disciplina, SUM(s.duracao_seg)::int AS segundos
       FROM sessoes_estudo s LEFT JOIN disciplinas d ON d.id = s.disciplina_id
      WHERE s.usuario_id = $1 AND EXTRACT(YEAR FROM s.inicio AT TIME ZONE $2) = $3
      GROUP BY 1 ORDER BY 2 DESC`,
    [req.usuarioId, FUSO, anoDaQuery(req)]
  );
  res.json(rows);
}));

module.exports = { sessoes, estatisticas };
