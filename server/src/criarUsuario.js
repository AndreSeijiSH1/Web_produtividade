// Cria (ou atualiza a senha de) o seu usuário.
// Uso: npm run criar-usuario -- "André" andre@email.com MinhaSenha123
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const { migrar } = require('./migrate');

async function main() {
  const [nome, email, senha] = process.argv.slice(2);
  if (!nome || !email || !senha) {
    console.log('Uso: npm run criar-usuario -- "Seu Nome" email@exemplo.com SuaSenha');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.log('Use uma senha com pelo menos 8 caracteres.');
    process.exit(1);
  }
  await migrar();
  const hash = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, lower($2), $3)
     ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, senha_hash = EXCLUDED.senha_hash
     RETURNING id, nome, email`,
    [nome, email, hash]
  );
  console.log('Usuário pronto:', rows[0]);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
