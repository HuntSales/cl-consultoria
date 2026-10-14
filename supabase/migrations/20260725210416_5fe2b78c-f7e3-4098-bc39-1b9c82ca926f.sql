
ALTER TABLE public.opcoes_resposta
  ADD COLUMN IF NOT EXISTS letra text,
  ADD COLUMN IF NOT EXISTS rotulo text,
  ADD COLUMN IF NOT EXISTS rotulo_descricao text;

ALTER TABLE public.perfis_resultado
  ADD COLUMN IF NOT EXISTS regras jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS min_regras integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cta_texto text,
  ADD COLUMN IF NOT EXISTS cta_url text;

ALTER TABLE public.respostas_diagnostico
  ADD COLUMN IF NOT EXISTS renda text,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS rotulos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.diagnosticos
  ADD COLUMN IF NOT EXISTS publico text NOT NULL DEFAULT 'geral';
