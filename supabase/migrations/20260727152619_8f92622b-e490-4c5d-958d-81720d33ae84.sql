-- 1. Etapas configuráveis
CREATE TABLE public.crm_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cor text NOT NULL DEFAULT '#051d40',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_etapas TO authenticated;
GRANT ALL ON public.crm_etapas TO service_role;
ALTER TABLE public.crm_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aprovados leem etapas" ON public.crm_etapas FOR SELECT TO authenticated USING (is_approved_user());
CREATE POLICY "Master admin gerencia etapas" ON public.crm_etapas FOR ALL TO authenticated USING (is_master_admin()) WITH CHECK (is_master_admin());
CREATE TRIGGER trg_crm_etapas_updated_at BEFORE UPDATE ON public.crm_etapas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.crm_etapas (titulo, cor, ordem) VALUES
  ('Novo', '#051d40', 0),
  ('Contatado', '#284356', 1),
  ('Devolutiva agendada', '#d0b266', 2),
  ('Proposta enviada', '#b8974f', 3),
  ('Cliente', '#05AA7B', 4),
  ('Perdido', '#9b2c2c', 5);

-- 2. Motivos de perda
CREATE TABLE public.motivos_perda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos_perda TO authenticated;
GRANT ALL ON public.motivos_perda TO service_role;
ALTER TABLE public.motivos_perda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aprovados leem motivos" ON public.motivos_perda FOR SELECT TO authenticated USING (is_approved_user());
CREATE POLICY "Master admin gerencia motivos" ON public.motivos_perda FOR ALL TO authenticated USING (is_master_admin()) WITH CHECK (is_master_admin());
CREATE TRIGGER trg_motivos_perda_updated_at BEFORE UPDATE ON public.motivos_perda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.motivos_perda (titulo, ordem) VALUES
  ('Sem orçamento', 0),
  ('Sem interesse no momento', 1),
  ('Escolheu concorrente', 2),
  ('Não retornou contato', 3),
  ('Momento inadequado', 4),
  ('Fora do perfil', 5);

-- 3. Desfecho e etapa dinâmica nos leads
CREATE TYPE public.lead_resultado AS ENUM ('aberto', 'ganho', 'perdido');

ALTER TABLE public.respostas_diagnostico
  ADD COLUMN etapa_id uuid REFERENCES public.crm_etapas(id) ON DELETE SET NULL,
  ADD COLUMN resultado public.lead_resultado NOT NULL DEFAULT 'aberto',
  ADD COLUMN motivo_perda_id uuid REFERENCES public.motivos_perda(id) ON DELETE SET NULL,
  ADD COLUMN fechado_em timestamptz;

UPDATE public.respostas_diagnostico r
SET etapa_id = e.id
FROM public.crm_etapas e
WHERE e.titulo = CASE r.etapa
    WHEN 'novo' THEN 'Novo'
    WHEN 'contatado' THEN 'Contatado'
    WHEN 'devolutiva_agendada' THEN 'Devolutiva agendada'
    WHEN 'proposta_enviada' THEN 'Proposta enviada'
    WHEN 'cliente' THEN 'Cliente'
    WHEN 'perdido' THEN 'Perdido'
  END;

CREATE INDEX idx_respostas_etapa_id ON public.respostas_diagnostico (etapa_id);

-- 4. Histórico de desfecho
CREATE OR REPLACE FUNCTION public.registrar_mudanca_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.resultado IS DISTINCT FROM OLD.resultado THEN
    INSERT INTO public.lead_eventos (resposta_id, autor_id, tipo, de, para)
    VALUES (NEW.id, auth.uid(), 'resultado', OLD.resultado::text, NEW.resultado::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_registrar_mudanca_resultado
AFTER UPDATE ON public.respostas_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_resultado();

-- 5. Histórico de mudança de etapa dinâmica
CREATE OR REPLACE FUNCTION public.registrar_mudanca_etapa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  de_titulo text;
  para_titulo text;
BEGIN
  IF NEW.etapa_id IS DISTINCT FROM OLD.etapa_id THEN
    SELECT titulo INTO de_titulo FROM public.crm_etapas WHERE id = OLD.etapa_id;
    SELECT titulo INTO para_titulo FROM public.crm_etapas WHERE id = NEW.etapa_id;
    INSERT INTO public.lead_eventos (resposta_id, autor_id, tipo, de, para)
    VALUES (NEW.id, auth.uid(), 'etapa', de_titulo, para_titulo);
  ELSIF NEW.etapa IS DISTINCT FROM OLD.etapa THEN
    INSERT INTO public.lead_eventos (resposta_id, autor_id, tipo, de, para)
    VALUES (NEW.id, auth.uid(), 'etapa', OLD.etapa::text, NEW.etapa::text);
  END IF;
  RETURN NEW;
END;
$$;