-- Organizador Acadêmico — estrutura do banco (PostgreSQL)
-- Pode rodar quantas vezes quiser: só cria o que ainda não existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disciplinas (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cor         TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, nome)
);

-- provas, trabalhos e atividades
CREATE TABLE IF NOT EXISTS eventos (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  disciplina_id  INTEGER REFERENCES disciplinas(id) ON DELETE SET NULL,
  titulo         TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'prova' CHECK (tipo IN ('prova', 'trabalho', 'atividade')),
  data           DATE NOT NULL,
  observacao     TEXT,
  concluido      BOOLEAN NOT NULL DEFAULT false,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_data ON eventos (usuario_id, data);

CREATE TABLE IF NOT EXISTS links (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  url         TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'Faculdade',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notas (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  conteudo       TEXT NOT NULL DEFAULT '',
  fixada         BOOLEAN NOT NULL DEFAULT false,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pré-sets personalizados do Pomodoro (os padrões ficam no front)
CREATE TABLE IF NOT EXISTS presets (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  foco_min    INTEGER NOT NULL CHECK (foco_min BETWEEN 1 AND 240),
  pausa_min   INTEGER NOT NULL CHECK (pausa_min BETWEEN 1 AND 120),
  longa_min   INTEGER NOT NULL CHECK (longa_min BETWEEN 1 AND 120),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- cada bloco de foco do Pomodoro (completo ou interrompido)
CREATE TABLE IF NOT EXISTS sessoes_estudo (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  disciplina_id  INTEGER REFERENCES disciplinas(id) ON DELETE SET NULL,
  inicio         TIMESTAMPTZ NOT NULL,
  duracao_seg    INTEGER NOT NULL CHECK (duracao_seg > 0 AND duracao_seg <= 86400),
  completa       BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_inicio ON sessoes_estudo (usuario_id, inicio);
