const { Pool, types } = require('pg');

// Colunas DATE voltam como texto "AAAA-MM-DD" (sem virar Date e sem pular de dia por fuso).
types.setTypeParser(1082, (v) => v);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Faltou a variável DATABASE_URL (veja o .env.example).');
  process.exit(1);
}

// Bancos na nuvem (Neon, Render, Supabase) exigem SSL; o local não.
const local = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: local ? false : { rejectUnauthorized: false },
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
