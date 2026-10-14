ALTER TABLE public.lead_anotacoes ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';

CREATE TABLE public.lead_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anotacao_id uuid NOT NULL REFERENCES public.lead_anotacoes(id) ON DELETE CASCADE,
  resposta_id uuid NOT NULL REFERENCES public.respostas_diagnostico(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id),
  path text NOT NULL,
  nome text NOT NULL,
  mime text,
  tamanho bigint NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_anexos_anotacao ON public.lead_anexos(anotacao_id);
CREATE INDEX idx_lead_anexos_resposta ON public.lead_anexos(resposta_id);

GRANT SELECT, INSERT, DELETE ON public.lead_anexos TO authenticated;
GRANT ALL ON public.lead_anexos TO service_role;

ALTER TABLE public.lead_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aprovados veem anexos" ON public.lead_anexos
  FOR SELECT TO authenticated USING (public.is_approved_user());

CREATE POLICY "Aprovados criam anexos" ON public.lead_anexos
  FOR INSERT TO authenticated WITH CHECK (public.is_approved_user() AND autor_id = auth.uid());

CREATE POLICY "Autor ou admin apaga anexos" ON public.lead_anexos
  FOR DELETE TO authenticated USING (public.is_approved_user() AND (autor_id = auth.uid() OR public.is_master_admin()));

CREATE POLICY "Aprovados leem arquivos de anexos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'lead-anexos' AND public.is_approved_user());

CREATE POLICY "Aprovados enviam arquivos de anexos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lead-anexos' AND public.is_approved_user());

CREATE POLICY "Aprovados apagam arquivos de anexos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'lead-anexos' AND public.is_approved_user());