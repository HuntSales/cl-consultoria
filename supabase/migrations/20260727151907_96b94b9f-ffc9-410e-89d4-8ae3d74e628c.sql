GRANT UPDATE ON public.respostas_diagnostico TO authenticated;

CREATE POLICY "Aprovados atualizam leads"
ON public.respostas_diagnostico
FOR UPDATE
TO authenticated
USING (is_approved_user())
WITH CHECK (is_approved_user());

DROP TRIGGER IF EXISTS trg_registrar_mudanca_etapa ON public.respostas_diagnostico;
CREATE TRIGGER trg_registrar_mudanca_etapa
AFTER UPDATE ON public.respostas_diagnostico
FOR EACH ROW
EXECUTE FUNCTION public.registrar_mudanca_etapa();

DROP TRIGGER IF EXISTS trg_respostas_updated_at ON public.respostas_diagnostico;
CREATE TRIGGER trg_respostas_updated_at
BEFORE UPDATE ON public.respostas_diagnostico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();