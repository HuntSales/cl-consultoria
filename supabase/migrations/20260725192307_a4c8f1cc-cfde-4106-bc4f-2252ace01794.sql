CREATE TYPE public.diagnostico_status AS ENUM ('rascunho', 'publicado');

CREATE TABLE public.diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  slug text UNIQUE NOT NULL,
  status public.diagnostico_status NOT NULL DEFAULT 'rascunho',
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosticos TO authenticated;
GRANT ALL ON public.diagnosticos TO service_role;

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios aprovados gerenciam seus proprios diagnosticos" 
  ON public.diagnosticos 
  FOR ALL 
  TO authenticated 
  USING (
    public.is_approved_user() 
    AND (criado_por = auth.uid() OR public.is_master_admin())
  )
  WITH CHECK (
    public.is_approved_user() 
    AND (criado_por = auth.uid() OR public.is_master_admin())
  );

CREATE TABLE public.dimensoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  peso_dimensao numeric NOT NULL DEFAULT 1 CHECK (peso_dimensao > 0),
  ordem int NOT NULL DEFAULT 0,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dimensoes TO authenticated;
GRANT ALL ON public.dimensoes TO service_role;

ALTER TABLE public.dimensoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios aprovados gerenciam dimensoes de seus diagnosticos" 
  ON public.dimensoes 
  FOR ALL 
  TO authenticated 
  USING (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.diagnosticos d 
      WHERE d.id = dimensoes.diagnostico_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  )
  WITH CHECK (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.diagnosticos d 
      WHERE d.id = dimensoes.diagnostico_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  );

CREATE TABLE public.perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimensao_id uuid NOT NULL REFERENCES public.dimensoes(id) ON DELETE CASCADE,
  texto text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  obrigatoria boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perguntas TO authenticated;
GRANT ALL ON public.perguntas TO service_role;

ALTER TABLE public.perguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios aprovados gerenciam perguntas de suas dimensoes" 
  ON public.perguntas 
  FOR ALL 
  TO authenticated 
  USING (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.dimensoes dim
      JOIN public.diagnosticos d ON d.id = dim.diagnostico_id
      WHERE dim.id = perguntas.dimensao_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  )
  WITH CHECK (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.dimensoes dim
      JOIN public.diagnosticos d ON d.id = dim.diagnostico_id
      WHERE dim.id = perguntas.dimensao_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  );

CREATE TABLE public.opcoes_resposta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta_id uuid NOT NULL REFERENCES public.perguntas(id) ON DELETE CASCADE,
  texto text NOT NULL,
  peso numeric NOT NULL DEFAULT 0,
  ordem int NOT NULL DEFAULT 0,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.opcoes_resposta TO authenticated;
GRANT ALL ON public.opcoes_resposta TO service_role;

ALTER TABLE public.opcoes_resposta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios aprovados gerenciam opcoes de suas perguntas" 
  ON public.opcoes_resposta 
  FOR ALL 
  TO authenticated 
  USING (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.perguntas p
      JOIN public.dimensoes dim ON dim.id = p.dimensao_id
      JOIN public.diagnosticos d ON d.id = dim.diagnostico_id
      WHERE p.id = opcoes_resposta.pergunta_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  )
  WITH CHECK (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.perguntas p
      JOIN public.dimensoes dim ON dim.id = p.dimensao_id
      JOIN public.diagnosticos d ON d.id = dim.diagnostico_id
      WHERE p.id = opcoes_resposta.pergunta_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  );

CREATE TABLE public.perfis_resultado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  faixa_min numeric NOT NULL DEFAULT 0,
  faixa_max numeric NOT NULL DEFAULT 100,
  cor text NOT NULL DEFAULT '#d0b266',
  ordem int NOT NULL DEFAULT 0,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis_resultado TO authenticated;
GRANT ALL ON public.perfis_resultado TO service_role;

ALTER TABLE public.perfis_resultado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios aprovados gerenciam perfis de seus diagnosticos" 
  ON public.perfis_resultado 
  FOR ALL 
  TO authenticated 
  USING (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.diagnosticos d 
      WHERE d.id = perfis_resultado.diagnostico_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  )
  WITH CHECK (
    public.is_approved_user() 
    AND EXISTS (
      SELECT 1 FROM public.diagnosticos d 
      WHERE d.id = perfis_resultado.diagnostico_id 
      AND (d.criado_por = auth.uid() OR public.is_master_admin())
    )
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_diagnosticos_updated_at BEFORE UPDATE ON public.diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dimensoes_updated_at BEFORE UPDATE ON public.dimensoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_perguntas_updated_at BEFORE UPDATE ON public.perguntas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opcoes_resposta_updated_at BEFORE UPDATE ON public.opcoes_resposta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_perfis_resultado_updated_at BEFORE UPDATE ON public.perfis_resultado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_diagnosticos_criado_por ON public.diagnosticos(criado_por);
CREATE INDEX idx_diagnosticos_slug ON public.diagnosticos(slug);
CREATE INDEX idx_dimensoes_diagnostico_id ON public.dimensoes(diagnostico_id);
CREATE INDEX idx_perguntas_dimensao_id ON public.perguntas(dimensao_id);
CREATE INDEX idx_opcoes_pergunta_id ON public.opcoes_resposta(pergunta_id);
CREATE INDEX idx_perfis_diagnostico_id ON public.perfis_resultado(diagnostico_id);
