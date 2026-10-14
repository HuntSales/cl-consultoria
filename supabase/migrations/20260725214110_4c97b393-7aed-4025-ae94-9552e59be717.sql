CREATE TYPE public.ramo_diagnostico AS ENUM ('comum','solteiro','casal');

ALTER TABLE public.dimensoes ADD COLUMN ramo public.ramo_diagnostico NOT NULL DEFAULT 'comum';
ALTER TABLE public.perguntas ADD COLUMN ramifica boolean NOT NULL DEFAULT false;
ALTER TABLE public.opcoes_resposta ADD COLUMN ramo public.ramo_diagnostico;
ALTER TABLE public.perfis_resultado ADD COLUMN ramo public.ramo_diagnostico NOT NULL DEFAULT 'comum';
ALTER TABLE public.respostas_diagnostico ADD COLUMN ramo public.ramo_diagnostico;