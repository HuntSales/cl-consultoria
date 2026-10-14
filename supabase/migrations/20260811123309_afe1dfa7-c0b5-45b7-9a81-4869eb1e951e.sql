ALTER TABLE public.respostas_diagnostico ADD COLUMN IF NOT EXISTS cpf text;
CREATE INDEX IF NOT EXISTS idx_respostas_cpf ON public.respostas_diagnostico (cpf);

CREATE TABLE public.consultor_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provedor text NOT NULL DEFAULT 'openai',
  modelo text,
  api_key_cifrada text,
  mcp_url text,
  mcp_token_cifrado text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultor_ai_config TO authenticated;
GRANT ALL ON public.consultor_ai_config TO service_role;
ALTER TABLE public.consultor_ai_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config propria" ON public.consultor_ai_config FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.clientes_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  mcp_cliente_cifrado text,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consultor_id, cpf)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes_gestao TO authenticated;
GRANT ALL ON public.clientes_gestao TO service_role;
ALTER TABLE public.clientes_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes proprios" ON public.clientes_gestao FOR ALL TO authenticated
  USING (consultor_id = auth.uid() OR public.is_master_admin())
  WITH CHECK (consultor_id = auth.uid() OR public.is_master_admin());

CREATE TABLE public.agente_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes_gestao(id) ON DELETE CASCADE,
  consultor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agente_conversas TO authenticated;
GRANT ALL ON public.agente_conversas TO service_role;
ALTER TABLE public.agente_conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversas proprias" ON public.agente_conversas FOR ALL TO authenticated
  USING (consultor_id = auth.uid() OR public.is_master_admin())
  WITH CHECK (consultor_id = auth.uid() OR public.is_master_admin());

CREATE TABLE public.agente_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.agente_conversas(id) ON DELETE CASCADE,
  papel text NOT NULL,
  conteudo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agente_mensagens_conversa ON public.agente_mensagens (conversa_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agente_mensagens TO authenticated;
GRANT ALL ON public.agente_mensagens TO service_role;
ALTER TABLE public.agente_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensagens proprias" ON public.agente_mensagens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agente_conversas c WHERE c.id = conversa_id AND (c.consultor_id = auth.uid() OR public.is_master_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agente_conversas c WHERE c.id = conversa_id AND (c.consultor_id = auth.uid() OR public.is_master_admin())));

CREATE TRIGGER trg_clientes_gestao_updated_at BEFORE UPDATE ON public.clientes_gestao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_consultor_ai_config_updated_at BEFORE UPDATE ON public.consultor_ai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agente_conversas_updated_at BEFORE UPDATE ON public.agente_conversas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();