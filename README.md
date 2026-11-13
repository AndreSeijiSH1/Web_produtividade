# Organizador Acadêmico

Web app pessoal para organizar provas, trabalhos, links, anotações e tempo de estudo (Pomodoro).
Substitui o README do GitHub que eu usava como calendário.

- **Front:** React + Vite (`client/`) → deploy no **Netlify**
- **API:** Node + Express (`server/`) → deploy no **Render**
- **Banco:** PostgreSQL → **Neon** (plano gratuito)

## O que tem

| Tela | Recursos |
|---|---|
| Início | Próxima prova com contagem de dias, alertas (itens em até 3 dias e atrasados), resumo, próximas entregas, links rápidos, anotação fixada |
| Agenda | Provas, trabalhos e atividades; abas Próximas/Concluídas/Todas; filtro por disciplina e tipo; marcar como feito; editar/apagar; cadastro de disciplinas |
| Links | Cartões por categoria (com categorias novas), editar/apagar |
| Anotações | Texto livre, fixar no topo (aparece no Início) |
| Pomodoro | Pré-sets 25/5, 50/10, 90/20, 15/3 + personalizados; pausa longa a cada 4 ciclos; sessão ligada a uma disciplina; tempo de hoje/mês/total; mapa do ano; horas por mês; tempo por disciplina |
| Geral | Login, tema claro/escuro/sistema, layout de celular com menu embaixo |

Detalhes do Pomodoro: o timer continua rodando ao trocar de página e sobrevive a um F5. Cada foco concluído vira uma linha em `sessoes_estudo`. Se você reiniciar ou pular no meio, os minutos já estudados também são salvos (a partir de 1 minuto). Se a internet cair, a sessão fica guardada no navegador e é enviada depois.

---

## Rodar no seu computador

Precisa de **Node 18+** e de um PostgreSQL. O mais fácil é já usar o banco do Neon (passo 1 do deploy) também para testar localmente.

```bash
# 1) API
cd server
cp .env.example .env        # preencha DATABASE_URL e JWT_SECRET
npm install
npm run criar-usuario -- "André Seiji" seu@email.com UmaSenhaForte123
npm run dev                 # http://localhost:3001

# 2) Front (em outro terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:3001
npm install
npm run dev                 # http://localhost:5173
```

As tabelas são criadas sozinhas quando a API sobe (arquivo `server/src/schema.sql`).

---

## Deploy (tudo no plano gratuito)

Antes de começar, suba esta pasta para um repositório no GitHub (pode ser privado).

### 1. Banco — Neon
1. Crie uma conta em neon.tech e um projeto (região mais próxima: São Paulo, se aparecer, ou US East).
2. Copie a **Connection string** (começa com `postgresql://` e termina com `?sslmode=require`).

### 2. Seu usuário
No seu computador, dentro de `server/`, coloque essa connection string no `.env` como `DATABASE_URL` e rode:
```bash
npm run criar-usuario -- "André Seiji" seu@email.com UmaSenhaForte123
```
Isso cria as tabelas no Neon e o seu login. Para trocar a senha depois, rode o mesmo comando com a senha nova.

### 3. API — Render
1. Em render.com: **New → Blueprint** e escolha o repositório. Ele lê o `render.yaml`.
2. Preencha `DATABASE_URL` (a do Neon). Em `FRONT_URL`, coloque por enquanto `http://localhost:5173`.
3. Quando terminar, abra `https://SEU-SERVICO.onrender.com/api/saude`. Tem que aparecer `{"ok":true}`.

> O plano grátis do Render "dorme" depois de um tempo sem uso. A primeira visita do dia pode demorar uns segundos, e a tela de login avisa quando isso acontece.

### 4. Front — Netlify
1. Em netlify.com: **Add new site → Import from Git** e escolha o repositório. O `netlify.toml` já configura a pasta `client`.
2. Em **Site configuration → Environment variables**, crie `VITE_API_URL` com o link do Render (sem `/` no final).
3. Faça o deploy e copie o link do site (ex.: `https://meu-organizador.netlify.app`).

### 5. Liberar o front na API
No Render, troque `FRONT_URL` pelo link do Netlify e salve. O serviço reinicia. Pronto: abra o link do Netlify e faça login.

---

## Estrutura

```
server/
  src/index.js        rotas e inicialização
  src/schema.sql      tabelas do banco
  src/auth.js         login com JWT
  src/recursos.js     CRUD: disciplinas, eventos, links, notas, presets
  src/pomodoro.js     sessões de estudo e estatísticas
client/
  src/contextos.jsx   login, tema e o timer do Pomodoro
  src/paginas/        Início, Agenda, Links, Anotações, Pomodoro, Login
  src/estilos.css     cores dos temas claro/escuro e layout
```

## API

Todas as rotas, exceto login e saúde, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/login` | `{ email, senha }` → `{ token, usuario }` |
| GET | `/api/auth/eu` | dados do usuário logado |
| GET/POST | `/api/disciplinas` | listar / criar `{ nome }` |
| GET/POST | `/api/eventos` | listar (`?status=pendente\|concluido&tipo=&disciplina_id=`) / criar `{ titulo, tipo, data, disciplina_id?, observacao? }` |
| GET/POST | `/api/links` | `{ titulo, url, categoria }` |
| GET/POST | `/api/notas` | `{ titulo, conteudo, fixada }` |
| GET/POST | `/api/presets` | `{ nome, foco_min, pausa_min, longa_min }` |
| PATCH/DELETE | `/api/<recurso>/:id` | editar só os campos enviados / apagar |
| POST | `/api/sessoes` | `{ inicio, duracao_seg, disciplina_id?, completa? }` |
| GET | `/api/sessoes?dia=AAAA-MM-DD` | sessões de um dia (padrão: hoje) |
| GET | `/api/estatisticas/resumo` | segundos de hoje, do mês e total |
| GET | `/api/estatisticas/mapa?ano=` | segundos por dia (mapa do ano) |
| GET | `/api/estatisticas/mensal?ano=` | segundos por mês (12 meses) |
| GET | `/api/estatisticas/disciplinas?ano=` | segundos por disciplina |

## Ideias para a versão 2
- Visão de calendário mensal na Agenda
- Lembretes por e-mail ou notificação no celular
- Instalar como app no celular (PWA)
