CREATE TYPE public.lead_etapa AS ENUM ('novo','contatado','devolutiva_agendada','proposta_enviada','cliente','perdido');

ALTER TABLE public.respostas_diagnostico
  ADD COLUMN etapa public.lead_etapa NOT NULL DEFAULT 'novo',
  ADD COLUMN responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN proximo_contato date,
  ADD COLUMN valor_estimado numeric(12,2),
  ADD COLUMN motivo_perda text;

DROP TRIGGER IF EXISTS respostas_diagnostico_updated_at ON public.respostas_diagnostico;
CREATE TRIGGER respostas_diagnostico_updated_at
BEFORE UPDATE ON public.respostas_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lead_anotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id uuid NOT NULL REFERENCES public.respostas_diagnostico(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  texto text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_anotacoes TO authenticated;
GRANT ALL ON public.lead_anotacoes TO service_role;
ALTER TABLE public.lead_anotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aprovados veem anotacoes" ON public.lead_anotacoes FOR SELECT TO authenticated USING (public.is_approved_user());
CREATE POLICY "Aprovados criam anotacoes" ON public.lead_anotacoes FOR INSERT TO authenticated WITH CHECK (public.is_approved_user() AND autor_id = auth.uid());
CREATE POLICY "Autor edita anotacoes" ON public.lead_anotacoes FOR UPDATE TO authenticated USING (public.is_approved_user() AND autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Autor ou admin apaga anotacoes" ON public.lead_anotacoes FOR DELETE TO authenticated USING (public.is_approved_user() AND (autor_id = auth.uid() OR public.is_master_admin()));

CREATE TABLE public.lead_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id uuid NOT NULL REFERENCES public.respostas_diagnostico(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  de text,
  para text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lead_eventos TO authenticated;
GRANT ALL ON public.lead_eventos TO service_role;
ALTER TABLE public.lead_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aprovados veem eventos" ON public.lead_eventos FOR SELECT TO authenticated USING (public.is_approved_user());
CREATE POLICY "Aprovados criam eventos" ON public.lead_eventos FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());

CREATE OR REPLACE FUNCTION public.registrar_mudanca_etapa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.etapa IS DISTINCT FROM OLD.etapa THEN
    INSERT INTO public.lead_eventos (resposta_id, autor_id, tipo, de, para)
    VALUES (NEW.id, auth.uid(), 'etapa', OLD.etapa::text, NEW.etapa::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER respostas_diagnostico_etapa
AFTER UPDATE ON public.respostas_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_etapa();

CREATE INDEX idx_respostas_etapa ON public.respostas_diagnostico (etapa);
CREATE INDEX idx_lead_anotacoes_resposta ON public.lead_anotacoes (resposta_id);
CREATE INDEX idx_lead_eventos_resposta ON public.lead_eventos (resposta_id);