# Devolutiva do Perfil Financeiro: gráfico de pizza + perfil completo

## O que muda

1. **Distribuição por perfil (gráfico de pizza)**
   Cada uma das 6 dimensões do diagnóstico Perfil Financeiro (Investidor, Poupador, Pagador Exemplar, Desapegado, Descontrolado, Gastador) vira uma fatia. O percentual de cada fatia = pontos obtidos naquele perfil ÷ soma dos pontos de todos os perfis, somando 100% (igual ao exemplo enviado). As cores das fatias usam a cor já cadastrada em cada perfil.

2. **Perfil predominante com o conteúdo completo**
   Além da descrição curta atual (mantida como resumo), cada perfil passa a ter o conteúdo dos anexos:
   - Como você se relaciona com o dinheiro
   - Interpretação Psicanalítica (+ Crenças inconscientes)
   - Pontos Fortes
   - Pontos de Melhoria
   - Riscos do Comportamento
   - Estratégias para Evolução

   Os textos são cadastrados exatamente como nos anexos para os 6 perfis.

3. **Onde aparece**
   - **Página de resultado do lead**: pizza com legenda e percentuais + bloco do perfil predominante com todas as seções.
   - **PDF da devolutiva**: pizza desenhada no documento + as mesmas seções do perfil.
   - **Painel interno (card do CRM)**: pizza e seções na aba de resultado do lead.
   - **E-mail de devolutiva**: como gráficos não são confiáveis em e-mail, entra a distribuição em formato de lista com barras percentuais (mesmas cores) + o conteúdo textual do perfil predominante, com os botões de agendamento já existentes.

Diagnósticos que não têm esse conteúdo cadastrado continuam exibindo exatamente o que exibem hoje — nada muda para eles.

## Detalhes técnicos

- **Banco**: nova coluna `conteudo jsonb` em `public.perfis_resultado` (`{ comoSeRelaciona, interpretacao, crencas[], pontosFortes[], pontosMelhoria[], riscos[], estrategias[] }`), com `UPDATE` na mesma migração preenchendo os 6 perfis do diagnóstico Perfil Financeiro conforme os anexos. Grants/RLS da tabela permanecem como estão.
- **Cálculo**: função utilitária em `src/lib/scoring.ts` que recebe `dimensoes_resultado` e devolve a participação percentual normalizada (arredondamento com ajuste para fechar 100%). Sem alteração no motor de pontuação nem nos registros já gravados.
- **Leitura**: `obterResultado` (`src/lib/respostas.functions.ts`) e o detalhe admin (`src/lib/respostas-admin.functions.ts`) passam a devolver o `conteudo` do perfil e a lista de fatias (título, cor, pontos, percentual).
- **UI**: componente compartilhado `PerfilDistribuicao` (Recharts `PieChart`) + `PerfilConteudo` usado em `src/routes/d.$slug_.r.$respostaId.tsx` e em `src/components/painel/LeadDrawer.tsx`, com tokens da paleta atual.
- **PDF**: `src/lib/devolutiva-pdf.ts` ganha desenho de setores via `doc.lines`/path para a pizza, legenda lateral e as seções do perfil.
- **E-mail**: `src/lib/email-templates/devolutiva-diagnostico.tsx` recebe `distribuicao[]` e `conteudoPerfil`, renderizados com tabelas/barras inline; `src/lib/email/devolutiva-email.server.ts` passa os novos dados.
- **Editor**: a aba de Pontuação/Perfis do editor de diagnóstico ganha campos para editar essas seções por perfil.
