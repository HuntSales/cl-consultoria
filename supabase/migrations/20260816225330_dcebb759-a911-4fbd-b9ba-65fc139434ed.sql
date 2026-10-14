CREATE TABLE public.diagnostico_sessoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  sessao_key uuid NOT NULL,
  aberto_em timestamp with time zone NOT NULL DEFAULT now(),
  iniciado_em timestamp with time zone,
  dados_em timestamp with time zone,
  concluido_em timestamp with time zone,
  resposta_id uuid REFERENCES public.respostas_diagnostico(id) ON DELETE SET NULL,
  origem text,
  utm jsonb,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, sessao_key)
);

GRANT SELECT, INSERT, UPDATE ON public.diagnostico_sessoes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.diagnostico_sessoes TO authenticated;
GRANT ALL ON public.diagnostico_sessoes TO service_role;

ALTER TABLE public.diagnostico_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer visitante pode registrar sessao"
ON public.diagnostico_sessoes FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Qualquer visitante pode atualizar a propria sessao"
ON public.diagnostico_sessoes FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios aprovados podem ver sessoes"
ON public.diagnostico_sessoes FOR SELECT TO authenticated
USING (public.is_approved_user());

CREATE INDEX idx_diagnostico_sessoes_diag ON public.diagnostico_sessoes(diagnostico_id, aberto_em DESC);

CREATE TRIGGER trg_diagnostico_sessoes_updated_at
BEFORE UPDATE ON public.diagnostico_sessoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();