import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contextos';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [servidor, setServidor] = useState('acordando'); // o plano grátis do Render "dorme"

  useEffect(() => {
    let ativo = true;
    const tentar = (n) => api.saude().then((ok) => {
      if (!ativo) return;
      if (ok) setServidor('ok');
      else if (n < 12) setTimeout(() => tentar(n + 1), 5000);
      else setServidor('fora');
    });
    tentar(0);
    return () => { ativo = false; };
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try { await entrar(email, senha); } catch (err) { setErro(err.message); setEnviando(false); }
  };

  return (
    <div className="login">
      <div className="cartao">
        <img src="/favicon.svg" alt="" width="40" height="40" />
        <h1>Organizador Acadêmico</h1>
        <p className="dica" style={{ marginBottom: 20 }}>Entre para ver suas provas, links e anotações.</p>
        <form className="form" onSubmit={enviar}>
          <label className="campo">E-mail
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="campo">Senha
            <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="botao primario" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
          <p className="dica" aria-live="polite">
            {servidor === 'acordando' && 'Conectando ao servidor… na primeira visita do dia isso pode levar alguns segundos.'}
            {servidor === 'ok' && 'Servidor conectado.'}
            {servidor === 'fora' && 'O servidor não respondeu. Tente recarregar a página.'}
          </p>
        </form>
      </div>
    </div>
  );
}
