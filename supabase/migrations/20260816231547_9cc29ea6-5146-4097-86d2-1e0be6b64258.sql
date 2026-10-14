ALTER TABLE public.perfis_resultado ADD COLUMN IF NOT EXISTS conteudo jsonb;

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você tem uma visão madura e estratégica sobre finanças. Enxerga o dinheiro como ferramenta para construir patrimônio e está sempre atento a oportunidades. Sua disciplina é um dos seus maiores diferenciais.",
  "interpretacao": "O controle financeiro funciona como uma forma de proteção emocional. Você busca previsibilidade para evitar riscos e garantir autonomia. O futuro tem um peso emocional importante para você.",
  "crencas": ["Se eu não controlar tudo, posso perder o que construí.", "Eu preciso garantir o futuro para não depender de ninguém."],
  "pontosFortes": ["Alta capacidade de poupar e manter foco", "Disciplina e constância", "Busca ativa por crescimento patrimonial", "Boa organização mental para metas de longo prazo"],
  "pontosMelhoria": ["Pode ser rígido demais com o orçamento", "Dificuldade em flexibilizar para momentos especiais", "Pode gerar conflitos com familiares por excesso de controle", "Tendência a priorizar o futuro e esquecer o presente"],
  "riscos": ["Perder oportunidades de viver experiências importantes", "Tornar o dinheiro um fim, e não um meio"],
  "estrategias": ["Criar uma \"reserva de prazer\" mensal para equilibrar vida e planejamento", "Envolver a família nas decisões financeiras", "Trabalhar metas emocionais além das metas financeiras", "Diversificar investimentos com foco em qualidade de vida"]
}'::jsonb WHERE titulo = 'Investidor' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você é organizado, consciente e equilibrado. Gosta de planejar, comparar e fazer boas escolhas. Seu foco não é apenas poupar, mas gastar bem.",
  "interpretacao": "Sua cautela vem do desejo de evitar erros. O dinheiro representa ordem, segurança e previsibilidade.",
  "crencas": ["Eu preciso pensar muito antes de agir.", "Errar financeiramente é perigoso."],
  "pontosFortes": ["Excelente capacidade de planejamento", "Consciência de consumo", "Boa relação entre presente e futuro", "Disciplina para seguir metas"],
  "pontosMelhoria": ["Pode pensar demais antes de gastar", "Pode evitar experiências por medo de gastar", "Pode entrar em conflito com pessoas mais impulsivas"],
  "riscos": ["Perder oportunidades por excesso de cautela", "Viver menos experiências por medo de errar financeiramente"],
  "estrategias": ["Criar limites claros para gastos de lazer sem culpa", "Aprender a delegar e confiar mais em outras pessoas", "Criar metas de experiências, não só metas financeiras"]
}'::jsonb WHERE titulo = 'Poupador' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você é responsável, organizado e evita dívidas. Gosta de manter tudo em ordem e tem uma relação saudável com o controle financeiro.",
  "interpretacao": "O dinheiro representa dever, estabilidade e responsabilidade. Há uma tendência a suprimir desejos para manter tudo sob controle.",
  "crencas": ["Meu papel é manter tudo em ordem.", "Não preciso de muito para ser feliz."],
  "pontosFortes": ["Não gasta mais do que ganha", "Evita juros e multas", "Tem autocontrole", "Sabe dizer \"não\" quando necessário"],
  "pontosMelhoria": ["Guarda dinheiro apenas quando sobra", "Pode se conformar com pouco", "Falta ambição para crescer financeiramente"],
  "riscos": ["Estagnar financeiramente", "Não construir patrimônio por falta de visão de longo prazo"],
  "estrategias": ["Criar metas de investimento claras", "Trabalhar ambição saudável", "Aprender a investir com mais confiança", "Criar um plano de crescimento patrimonial"]
}'::jsonb WHERE titulo = 'Pagador Exemplar' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você vive o presente e não se preocupa muito com o futuro. Gosta de aproveitar a vida e não gosta de se prender a controles.",
  "interpretacao": "Há uma tendência a evitar responsabilidades que geram ansiedade. O futuro pode parecer ameaçador ou distante.",
  "crencas": ["Pensar no futuro gera ansiedade.", "Eu resolvo quando chegar a hora."],
  "pontosFortes": ["Flexibilidade", "Capacidade de reduzir gastos quando decide", "Não sofre com excesso de controle"],
  "pontosMelhoria": ["Falta de planejamento", "Dificuldade em criar metas", "Falta de organização financeira"],
  "riscos": ["Endividamento", "Falta de reserva de emergência", "Dependência de terceiros para decisões financeiras"],
  "estrategias": ["Criar metas simples e curtas", "Automatizar investimentos para não depender de disciplina", "Criar uma reserva mínima de segurança", "Acompanhar gastos semanalmente"]
}'::jsonb WHERE titulo = 'Desapegado' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você tem dificuldade em acompanhar sua vida financeira. O dinheiro entra e sai sem clareza, e isso gera estresse e conflitos.",
  "interpretacao": "O dinheiro funciona como fuga emocional. Gastar alivia tensões, mas traz culpa depois.",
  "crencas": ["Eu não consigo controlar isso.", "Gastar me faz sentir melhor."],
  "pontosFortes": ["Generosidade", "Desejo de agradar", "Boa intenção nas decisões"],
  "pontosMelhoria": ["Falta de controle", "Contas atrasadas", "Dificuldade em seguir planos"],
  "riscos": ["Endividamento crônico", "Conflitos familiares", "Falta de segurança financeira"],
  "estrategias": ["Criar rotina semanal de organização", "Usar ferramentas simples de controle", "Criar metas pequenas e alcançáveis", "Trabalhar consciência sobre impulsos"]
}'::jsonb WHERE titulo = 'Descontrolado' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';

UPDATE public.perfis_resultado SET conteudo = '{
  "comoSeRelaciona": "Você valoriza experiências, liberdade e prazer. Gosta de viver bem e não tem medo de gastar. Porém, isso pode comprometer seu futuro.",
  "interpretacao": "O dinheiro funciona como fonte de prazer, validação e liberdade. Limites podem parecer restritivos.",
  "crencas": ["Eu mereço aproveitar agora.", "Limites me prendem."],
  "pontosFortes": ["Aproveita a vida", "Aberto a novas experiências", "Energia e entusiasmo"],
  "pontosMelhoria": ["Gasta mais do que ganha", "Falta de reserva", "Impulsividade"],
  "riscos": ["Endividamento", "Falta de segurança", "Dependência de estabilidade no trabalho"],
  "estrategias": ["Criar limite mensal de lazer", "Construir reserva de emergência", "Planejar compras grandes", "Trabalhar consciência sobre impulsos"]
}'::jsonb WHERE titulo = 'Gastador' AND diagnostico_id = '2606d463-df24-4729-bc02-80f08d283f2e';