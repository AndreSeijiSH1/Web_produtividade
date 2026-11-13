const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { rota, ErroHttp, exigir } = require('./util');

const SEGREDO = process.env.JWT_SECRET;
if (!SEGREDO || SEGREDO.length < 16) {
  console.error('Defina JWT_SECRET com pelo menos 16 caracteres (veja o .env.example).');
  process.exit(1);
}

// Middleware: só deixa passar quem mandou um token válido.
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  try {
    const dados = jwt.verify(token, SEGREDO);
    req.usuarioId = dados.sub;
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Faça login de novo.' });
  }
}

const router = express.Router();

router.post('/login', rota(async (req, res) => {
  exigir(req.body, ['email', 'senha']);
  const { rows } = await db.query('SELECT * FROM usuarios WHERE email = lower($1)', [req.body.email]);
  const usuario = rows[0];
  const ok = usuario && (await bcrypt.compare(String(req.body.senha), usuario.senha_hash));
  if (!ok) throw new ErroHttp(401, 'E-mail ou senha incorretos.');
  const token = jwt.sign({ sub: usuario.id }, SEGREDO, { expiresIn: '30d' });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
}));

router.get('/eu', autenticar, rota(async (req, res) => {
  const { rows } = await db.query('SELECT id, nome, email FROM usuarios WHERE id = $1', [req.usuarioId]);
  if (!rows[0]) throw new ErroHttp(401, 'Usuário não encontrado.');
  res.json(rows[0]);
}));

module.exports = { router, autenticar };
