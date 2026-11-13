require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrar() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { migrar };

// Rodando direto: npm run migrate
if (require.main === module) {
  migrar()
    .then(() => { console.log('Tabelas criadas/atualizadas.'); return pool.end(); })
    .catch((err) => { console.error(err); process.exit(1); });
}
