ALTER TABLE public.perfis_resultado
  ADD COLUMN IF NOT EXISTS dimensao_id uuid REFERENCES public.dimensoes(id) ON DELETE SET NULL;

ALTER TABLE public.perfis_resultado DROP CONSTRAINT IF EXISTS perfis_resultado_modo_ativacao_check;
ALTER TABLE public.perfis_resultado
  ADD CONSTRAINT perfis_resultado_modo_ativacao_check
  CHECK (modo_ativacao = ANY (ARRAY['faixa'::text, 'regras'::text, 'hibrido'::text, 'dimensao'::text]));

DO $seed$
DECLARE
  v_owner uuid;
  v_diag uuid;
  v_dim uuid;
  v_perg uuid;
  v_bloco jsonb;
  v_texto text;
  v_ordem_dim int := 0;
  v_ordem_perg int;
  v_dados jsonb := '[{"perfil": "Investidor", "cor": "#05AA7B", "descricao": "Você enxerga o dinheiro como ferramenta de construção de patrimônio. Guarda com regularidade, é disciplinado com metas e busca crescer. O ponto de atenção é a rigidez: excesso de controle pode gerar conflito com quem está ao seu lado e tirar o prazer do presente.", "perguntas": ["Você entende a importância de guardar dinheiro regularmente?", "Você costuma restringir gastos para poupar mais?", "Você já recebeu críticas por ser \"econômico demais\" ou \"pão duro\"?", "Você é disciplinado com seus objetivos financeiros?", "Você tem facilidade em economizar?", "Você busca constantemente formas de aumentar seu patrimônio?", "Você tem dificuldade em envolver a família nos planos financeiros?", "Você é visto como detalhista ou \"chato\" ao falar de dinheiro?", "Você tem dificuldade em flexibilizar o planejamento em momentos especiais?"]}, {"perfil": "Poupador", "cor": "#1cb082", "descricao": "Você equilibra bem organização e consumo consciente: planeja, compara e faz boas escolhas. O risco é o excesso de análise — pensar demais antes de gastar pode adiar experiências importantes e gerar atrito com quem tem outro ritmo.", "perguntas": ["Você controla seus gastos com disciplina e organização?", "Para você, poupar é importante, mas fazer boas compras também?", "Você usa planilhas, listas ou algum método para planejar compras?", "Você tem facilidade de desenvolver planos financeiros e coloca-los em prática ?", "Você faz escolhas inteligentes ao comprar ?", "Você equilibra bem o presente com o futuro ao gastar?", "Você pensa demais antes de gastar seu dinheiro ?", "Você evita novas experiências por causa do custo?", "Você entra em conflito com pessoas que gostam de novidades?"]}, {"perfil": "Pagador Exemplar", "cor": "#284356", "descricao": "Você honra compromissos, evita juros e vive dentro do que ganha. Tem autocontrole e sabe dizer não. O ponto de atenção é o conformismo: segurança demais pode limitar o crescimento do seu patrimônio e a ambição por novos objetivos.", "perguntas": ["Você evita pagar juros e multas?", "Você não gasta mais do que ganha ?", "Você planeja antes de fazer compras maiores?", "Você tem capacidade de investir quando necessário?", "Você tem autocontrole sobre o dinheiro ?", "Você sabe dizer não quando precisa ?", "Você se conforma facilmente com seu padrão de vida?", "Você é conformado com seu padrão de vida ?", "Você não se considera uma pessoa ambiciosa financeiramente?"]}, {"perfil": "Desapegado", "cor": "#d0b266", "descricao": "Sua relação com o dinheiro é leve e pouco planejada. Você reage bem quando decide cortar gastos, mas costuma deixar o controle para depois — ou para outra pessoa. O risco é viver sem objetivos claros e pagar caro por isso em juros e oportunidades perdidas.", "perguntas": ["Quando recebe um valor extra, você tende a gastar tudo rapidamente?", "Se não tem dinheiro à vista, você parcela sem pensar muito?", "Você acredita que ainda é cedo para pensar no futuro financeiro?", "Você tem folgas financeiras eventualmente ?", "Você consegue reduzir gastos quando realmente decide?", "Você costuma deixar outra pessoa cuidar das finanças?", "Você tem dificuldade em planejar e definir objetivos?", "Você não gosta de prestar contas e/ou dar satistfação sobre seus gastos?", "Você frequentemente paga juros e multas?"]}, {"perfil": "Descontrolado", "cor": "#c0392b", "descricao": "Você não tem clareza de quanto entra e quanto sai, e o dinheiro some antes do fim do mês. Crédito vira extensão da renda e as contas atrasam. O primeiro passo é diagnóstico e organização — sem culpa, com método.", "perguntas": ["Você não sabe exatamente quanto ganha e quanto gasta?", "O dinheiro \"desaparece\" da sua conta todo mês?", "Você usa com frequência o cheque especial e o limite do cartão de crédito ?", "Você raramente encontra tempo para organizar suas finanças?", "Você gosta de agradar outras pessoas com presentes ou favores?", "Você gasta para evitar pensar sobre dinheiro?", "Você tem conflitos familiares por causa de dinheiro?", "Você costuma ter contas atrasadas?", "Você tem dificuldade em seguir um plano financeiro ?"]}, {"perfil": "Gastador", "cor": "#8e44ad", "descricao": "Você valoriza aproveitar a vida agora e é movido por experiências. Isso traz repertório e prazer, mas sem reserva e com dívidas o custo é alto. O caminho é manter o estilo de vida sustentando-o com estrutura financeira.", "perguntas": ["Você acredita que deve aproveitar a vida hoje, sem pensar muito no amanhã?", "Você gasta mais do que ganham e sempre esta no ciclo vicioso de dívidas?", "Você aceita financiamentos longos para ter o que deseja?", "Você é admirado pelo seu estilo de vida?", "Você gosta de experimentar coisas novas, independentemente do custo?", "Você costuma sair ou gastar dinheiro nos finais de semana?", "Você possui muitos hobbies?", "Você depende muito da estabilidade do emprego ou negócio?", "Você não possui reserva de emergência?", "Você não se preocupa em ficar endividado ou com o nome sujo?"]}]'::jsonb;
  v_escala jsonb := '[
    {"letra":"A","peso":0,"rotulo":"Nada a ver comigo","texto":"0 - Nada a ver comigo"},
    {"letra":"B","peso":2,"rotulo":"Muito pouco","texto":"2 - Tem muito pouco a ver"},
    {"letra":"C","peso":4,"rotulo":"Pouco","texto":"4 - Tem pouco a ver"},
    {"letra":"D","peso":6,"rotulo":"Em parte","texto":"6 - Tem algo a ver"},
    {"letra":"E","peso":8,"rotulo":"Bastante","texto":"8 - Tem bastante a ver"},
    {"letra":"F","peso":10,"rotulo":"Tudo a ver","texto":"10 - Tem tudo a ver comigo"}
  ]'::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM public.diagnosticos WHERE slug = 'perfil-financeiro') THEN
    RETURN;
  END IF;

  SELECT criado_por INTO v_owner FROM public.diagnosticos ORDER BY criado_em LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuario disponivel para criar o diagnostico';
  END IF;

  INSERT INTO public.diagnosticos (titulo, descricao, slug, status, criado_por, publico, capa_itens, link_agendamento)
  VALUES (
    'Diagnóstico Perfil Financeiro',
    'Identifique qual perfil financeiro predomina no seu comportamento com dinheiro: Investidor, Poupador, Pagador Exemplar, Desapegado, Descontrolado ou Gastador.',
    'perfil-financeiro',
    'rascunho',
    v_owner,
    'geral',
    E'55 perguntas rápidas\nCerca de 7 minutos\nResultado imediato com seu perfil dominante',
    NULL
  )
  RETURNING id INTO v_diag;

  FOR v_bloco IN SELECT * FROM jsonb_array_elements(v_dados)
  LOOP
    v_ordem_dim := v_ordem_dim + 1;

    INSERT INTO public.dimensoes (diagnostico_id, titulo, descricao, peso_dimensao, ordem, ramo)
    VALUES (v_diag, v_bloco->>'perfil', NULL, 1, v_ordem_dim, 'comum')
    RETURNING id INTO v_dim;

    v_ordem_perg := 0;
    FOR v_texto IN SELECT jsonb_array_elements_text(v_bloco->'perguntas')
    LOOP
      v_ordem_perg := v_ordem_perg + 1;
      INSERT INTO public.perguntas (dimensao_id, texto, ordem, obrigatoria, ramifica, peso_pergunta)
      VALUES (v_dim, v_texto, v_ordem_perg, true, false, 1)
      RETURNING id INTO v_perg;

      INSERT INTO public.opcoes_resposta (pergunta_id, texto, peso, ordem, letra, rotulo, ramo)
      SELECT v_perg, e->>'texto', (e->>'peso')::numeric, (idx)::int, e->>'letra', e->>'rotulo', NULL
      FROM jsonb_array_elements(v_escala) WITH ORDINALITY AS t(e, idx);
    END LOOP;

    INSERT INTO public.perfis_resultado (
      diagnostico_id, titulo, descricao, faixa_min, faixa_max, cor, ordem,
      regras, min_regras, modo_ativacao, ramo, dimensao_id, cta_texto
    )
    VALUES (
      v_diag,
      v_bloco->>'perfil',
      v_bloco->>'descricao',
      0, 100,
      v_bloco->>'cor',
      v_ordem_dim,
      '[]'::jsonb,
      1,
      'dimensao',
      'comum',
      v_dim,
      'Agendar sessão estratégica'
    );
  END LOOP;
END
$seed$;