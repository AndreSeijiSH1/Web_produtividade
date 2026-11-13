// Utilidades de data, sempre no horário local de quem está usando.
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// "2026-11-26" -> Date local à meia-noite (sem pular de dia por fuso)
export function deTexto(s) {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function paraTexto(dt) {
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

export const hojeTexto = () => paraTexto(new Date());

export function diasAte(s) {
  const hoje = deTexto(hojeTexto());
  return Math.round((deTexto(s) - hoje) / 86400000);
}

// "26/11 · qui"
export function curta(s) {
  const dt = deTexto(s);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')} · ${DIAS[dt.getDay()]}`;
}

export function partes(s) {
  const dt = deTexto(s);
  return { dia: String(dt.getDate()).padStart(2, '0'), mes: MESES[dt.getMonth()].toLowerCase(), semana: DIAS[dt.getDay()] };
}

export function hojeExtenso() {
  const dt = new Date();
  return `${DIAS_LONGOS[dt.getDay()]}, ${dt.getDate()} de ${MESES_LONGOS[dt.getMonth()]}`;
}

export function faltam(n) {
  if (n < 0) return n === -1 ? 'ontem' : `há ${-n} dias`;
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  return `${n} dias`;
}

// 5400 -> "1h 30min"
export function duracao(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

export function hora(iso) {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}
