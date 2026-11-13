require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { migrar } = require('./migrate');
const { router: auth, autenticar } = require('./auth');
const { disciplinas, eventos, links, notas, presets } = require('./recursos');
const { sessoes, estatisticas } = require('./pomodoro');

const app = express();

// Só o seu front (FRONT_URL) pode chamar a API pelo navegador.
// Várias origens podem ser separadas por vírgula.
const origens = (process.env.FRONT_URL || 'http://localhost:5173')
  .split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({ origin: origens }));
app.use(express.json({ limit: '200kb' }));

// Rota pública para checar se a API está no ar (e "acordar" o Render).
app.get('/api/saude', (req, res) => res.json({ ok: true }));

app.use('/api/auth', auth);

// Daqui pra baixo, tudo exige login.
app.use('/api', autenticar);
app.use('/api/disciplinas', disciplinas);
app.use('/api/eventos', eventos);
app.use('/api/links', links);
app.use('/api/notas', notas);
app.use('/api/presets', presets);
app.use('/api/sessoes', sessoes);
app.use('/api/estatisticas', estatisticas);

app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Tratador de erros: transforma erros conhecidos em respostas claras.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ erro: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  // Erros do PostgreSQL
  if (err.code === '23505') return res.status(409).json({ erro: 'Já existe um item com esse nome.' });
  if (['23514', '22P02', '22007', '22008', '23502'].includes(err.code)) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORTA = process.env.PORT || 3001;

migrar()
  .then(() => app.listen(PORTA, () => console.log(`API rodando na porta ${PORTA}`)))
  .catch((err) => { console.error('Não consegui preparar o banco:', err.message); process.exit(1); });
