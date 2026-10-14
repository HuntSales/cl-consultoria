ALTER TABLE public.perguntas ADD COLUMN IF NOT EXISTS peso_pergunta numeric NOT NULL DEFAULT 1;
ALTER TABLE public.perfis_resultado ADD COLUMN IF NOT EXISTS modo_ativacao text NOT NULL DEFAULT 'hibrido';
ALTER TABLE public.perfis_resultado DROP CONSTRAINT IF EXISTS perfis_resultado_modo_ativacao_check;
ALTER TABLE public.perfis_resultado ADD CONSTRAINT perfis_resultado_modo_ativacao_check CHECK (modo_ativacao IN ('faixa','regras','hibrido'));