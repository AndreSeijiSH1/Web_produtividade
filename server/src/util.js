// Pequenas ajudas usadas pelas rotas.

// Envolve uma rota async para que erros caiam no tratador de erros do Express.
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Monta "SET a = $1, b = $2" só com os campos permitidos que vieram no corpo.
function montarUpdate(corpo, permitidos, inicioParam = 1) {
  const sets = [];
  const valores = [];
  for (const campo of permitidos) {
    if (Object.prototype.hasOwnProperty.call(corpo, campo)) {
      valores.push(corpo[campo] === '' ? null : corpo[campo]);
      sets.push(`${campo} = $${inicioParam + valores.length - 1}`);
    }
  }
  return { sets, valores };
}

function exigir(corpo, campos) {
  for (const c of campos) {
    if (corpo[c] === undefined || corpo[c] === null || String(corpo[c]).trim() === '') {
      throw new ErroHttp(400, `O campo "${c}" é obrigatório.`);
    }
  }
}

const idValido = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(400, 'ID inválido.');
  return n;
};

module.exports = { rota, ErroHttp, montarUpdate, exigir, idValido };
