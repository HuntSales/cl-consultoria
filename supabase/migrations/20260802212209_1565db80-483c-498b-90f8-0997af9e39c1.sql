CREATE TABLE public.origens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.origens TO authenticated;
GRANT ALL ON public.origens TO service_role;

ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aprovados leem origens" ON public.origens
  FOR SELECT TO authenticated USING (public.is_approved_user());

CREATE POLICY "Master admin gerencia origens" ON public.origens
  FOR ALL TO authenticated USING (public.is_master_admin()) WITH CHECK (public.is_master_admin());

CREATE TRIGGER update_origens_updated_at
  BEFORE UPDATE ON public.origens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.respostas_diagnostico
  ADD COLUMN origem_id uuid REFERENCES public.origens(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.registrar_mudanca_origem()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  de_titulo text;
  para_titulo text;
BEGIN
  IF NEW.origem_id IS DISTINCT FROM OLD.origem_id THEN
    SELECT titulo INTO de_titulo FROM public.origens WHERE id = OLD.origem_id;
    SELECT titulo INTO para_titulo FROM public.origens WHERE id = NEW.origem_id;
    INSERT INTO public.lead_eventos (resposta_id, autor_id, tipo, de, para)
    VALUES (NEW.id, auth.uid(), 'origem', de_titulo, para_titulo);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_mudanca_origem() FROM anon, authenticated;

CREATE TRIGGER trg_registrar_mudanca_origem
  AFTER UPDATE ON public.respostas_diagnostico
  FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_origem();