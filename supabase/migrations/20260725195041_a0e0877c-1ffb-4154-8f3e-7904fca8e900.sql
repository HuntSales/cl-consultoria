CREATE TABLE public.respostas_diagnostico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  diagnostico_titulo text NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  consentimento boolean NOT NULL DEFAULT false,
  score numeric NOT NULL DEFAULT 0,
  score_maximo numeric NOT NULL DEFAULT 0,
  score_percentual numeric NOT NULL DEFAULT 0,
  perfil_id uuid REFERENCES public.perfis_resultado(id) ON DELETE SET NULL,
  perfil_titulo text,
  perfil_descricao text,
  perfil_cor text,
  dimensoes_resultado jsonb NOT NULL DEFAULT '[]'::jsonb,
  insights jsonb,
  origem text,
  utm jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.respostas_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id uuid NOT NULL REFERENCES public.respostas_diagnostico(id) ON DELETE CASCADE,
  dimensao_id uuid,
  dimensao_titulo text,
  pergunta_id uuid,
  pergunta_texto text NOT NULL,
  opcao_id uuid,
  opcao_texto text NOT NULL,
  peso_aplicado numeric NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_respostas_diagnostico_diag ON public.respostas_diagnostico(diagnostico_id);
CREATE INDEX idx_respostas_itens_resposta ON public.respostas_itens(resposta_id);

GRANT SELECT ON public.respostas_diagnostico TO authenticated;
GRANT DELETE ON public.respostas_diagnostico TO authenticated;
GRANT SELECT ON public.respostas_itens TO authenticated;
GRANT ALL ON public.respostas_diagnostico TO service_role;
GRANT ALL ON public.respostas_itens TO service_role;

ALTER TABLE public.respostas_diagnostico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aprovados leem respostas" ON public.respostas_diagnostico
FOR SELECT TO authenticated USING (public.is_approved_user());

CREATE POLICY "Master admin remove respostas" ON public.respostas_diagnostico
FOR DELETE TO authenticated USING (public.is_master_admin());

CREATE POLICY "Aprovados leem itens de respostas" ON public.respostas_itens
FOR SELECT TO authenticated USING (public.is_approved_user());

CREATE TRIGGER update_respostas_diagnostico_updated_at
BEFORE UPDATE ON public.respostas_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();