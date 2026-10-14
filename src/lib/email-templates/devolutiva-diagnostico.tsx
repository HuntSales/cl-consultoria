import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { TemplateEntry } from "./registry";

interface Dimensao {
  titulo: string;
  scorePercentual: number;
}

interface Fatia {
  id?: string;
  titulo: string;
  percentual: number;
  cor: string;
}

interface ConteudoPerfil {
  comoSeRelaciona?: string;
  interpretacao?: string;
  crencas?: string[];
  pontosFortes?: string[];
  pontosMelhoria?: string[];
  riscos?: string[];
  estrategias?: string[];
}

interface Props {
  nome?: string;
  diagnosticoTitulo?: string;
  scorePercentual?: number;
  perfilTitulo?: string | null;
  perfilDescricao?: string | null;
  dimensoes?: Dimensao[];
  distribuicao?: Fatia[];
  conteudoPerfil?: ConteudoPerfil | null;
  linkAgendamento?: string | null;
  linkResultado?: string;
}

const NAVY = "#051d40";
const GOLD = "#d0b266";
const OFFWHITE = "#f8f6f1";
const TEXT = "#284356";

const ListaPerfil = ({ titulo, itens }: { titulo: string; itens?: string[] }) => {
  if (!itens || itens.length === 0) return null;
  return (
    <>
      <Text style={sectionTitle}>{titulo.toUpperCase()}</Text>
      {itens.map((item) => (
        <Text key={item} style={itemLista}>
          • {item}
        </Text>
      ))}
    </>
  );
};

const DevolutivaEmail = ({
  nome = "",
  diagnosticoTitulo = "Diagnóstico Financeiro",
  scorePercentual = 0,
  perfilTitulo = null,
  perfilDescricao = null,
  dimensoes = [],
  distribuicao = [],
  conteudoPerfil = null,
  linkAgendamento = null,
  linkResultado = "",
}: Props) => {

  const primeiroNome = (nome || "").trim().split(" ")[0] || "Olá";

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`${primeiroNome}, sua devolutiva do ${diagnosticoTitulo} está pronta.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>CIBELE LUCENA</Text>
            <Text style={brandSub}>CONSULTORIA FINANCEIRA</Text>
          </Section>

          <Section style={card}>
            <Heading style={h1}>{primeiroNome}, seu diagnóstico está pronto</Heading>
            <Text style={paragraph}>{diagnosticoTitulo}</Text>

            <Section style={scoreBox}>
              <Text style={scoreLabel}>PONTUAÇÃO GERAL</Text>
              <Text style={scoreValue}>{scorePercentual}%</Text>
              {perfilTitulo ? (
                <>
                  <Text style={scoreLabel}>SEU PERFIL</Text>
                  <Text style={perfil}>{perfilTitulo}</Text>
                </>
              ) : null}
            </Section>

            {perfilDescricao ? <Text style={paragraph}>{perfilDescricao}</Text> : null}

            {distribuicao.length > 1 ? (
              <>
                <Hr style={hr} />
                <Text style={sectionTitle}>DISTRIBUIÇÃO DE PONTOS POR PERFIL</Text>
                {distribuicao.map((f) => (
                  <Section key={f.titulo} style={{ marginBottom: "8px" }}>
                    <Text style={dimLinha}>
                      {f.titulo} — <strong>{f.percentual}%</strong>
                    </Text>
                    <Section
                      style={{
                        backgroundColor: "#e6e2d8",
                        borderRadius: "4px",
                        height: "8px",
                        width: "100%",
                      }}
                    >
                      <Section
                        style={{
                          backgroundColor: f.cor,
                          borderRadius: "4px",
                          height: "8px",
                          width: `${Math.max(2, f.percentual)}%`,
                        }}
                      />
                    </Section>
                  </Section>
                ))}
              </>
            ) : null}

            {conteudoPerfil ? (
              <>
                <Hr style={hr} />
                <Text style={h2}>{perfilTitulo ? `Perfil ${perfilTitulo}` : "Seu perfil"}</Text>
                {conteudoPerfil.comoSeRelaciona ? (
                  <>
                    <Text style={sectionTitle}>COMO VOCÊ SE RELACIONA COM O DINHEIRO</Text>
                    <Text style={paragraph}>{conteudoPerfil.comoSeRelaciona}</Text>
                  </>
                ) : null}
                {conteudoPerfil.interpretacao ? (
                  <>
                    <Text style={sectionTitle}>INTERPRETAÇÃO PSICANALÍTICA</Text>
                    <Text style={paragraph}>{conteudoPerfil.interpretacao}</Text>
                  </>
                ) : null}
                {conteudoPerfil.crencas && conteudoPerfil.crencas.length > 0 ? (
                  <>
                    <Text style={{ ...paragraph, fontWeight: 700, margin: "6px 0 2px" }}>
                      Crenças inconscientes
                    </Text>
                    {conteudoPerfil.crencas.map((c) => (
                      <Text key={c} style={{ ...itemLista, fontStyle: "italic" }}>
                        “{c}”
                      </Text>
                    ))}
                  </>
                ) : null}
                <ListaPerfil titulo="Pontos fortes" itens={conteudoPerfil.pontosFortes} />
                <ListaPerfil titulo="Pontos de melhoria" itens={conteudoPerfil.pontosMelhoria} />
                <ListaPerfil titulo="Riscos do comportamento" itens={conteudoPerfil.riscos} />
                <ListaPerfil titulo="Estratégias para evolução" itens={conteudoPerfil.estrategias} />
              </>
            ) : null}

            {dimensoes.length > 0 ? (
              <>
                <Hr style={hr} />
                <Text style={sectionTitle}>LEITURA POR DIMENSÃO</Text>
                {dimensoes.map((dim) => (
                  <Text key={dim.titulo} style={dimLinha}>
                    {dim.titulo} — <strong>{dim.scorePercentual}%</strong>
                  </Text>
                ))}
              </>
            ) : null}

            <Hr style={hr} />


            <Text style={paragraph}>
              Na sessão estratégica de devolutiva, revisamos ponto por ponto o seu diagnóstico e definimos
              as prioridades dos próximos 90 dias.
            </Text>

            {linkAgendamento ? (
              <Section style={{ textAlign: "center", marginTop: "24px" }}>
                <Link href={linkAgendamento} style={btnPrimary}>
                  Agendar devolutiva agora
                </Link>
              </Section>
            ) : null}

            {linkResultado ? (
              <Section style={{ textAlign: "center", marginTop: "14px" }}>
                <Link href={linkResultado} style={btnSecondary}>
                  Ver meu resultado completo
                </Link>
              </Section>
            ) : null}
          </Section>

          <Text style={footer}>
            Cibele Lucena Consultoria Financeira
            <br />
            Este e-mail foi enviado porque você concluiu um diagnóstico em nosso site.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: DevolutivaEmail,
  subject: (data: Record<string, any>) => {
    const primeiro = String(data?.nome ?? "").trim().split(" ")[0];
    return primeiro
      ? `${primeiro}, sua devolutiva do diagnóstico está pronta`
      : "Sua devolutiva do diagnóstico está pronta";
  },
  displayName: "Devolutiva do Diagnóstico",
  previewData: {
    nome: "Maria Souza",
    diagnosticoTitulo: "Diagnóstico Financeiro Comportamental",
    scorePercentual: 68,
    perfilTitulo: "Você usa o dinheiro para regular emoções internas",
    perfilDescricao:
      "Suas decisões financeiras estão fortemente ligadas ao seu estado emocional. Reconhecer esse padrão é o primeiro passo para mudá-lo.",
    dimensoes: [
      { titulo: "Comportamento", scorePercentual: 72 },
      { titulo: "Organização", scorePercentual: 55 },
      { titulo: "Crenças", scorePercentual: 80 },
    ],
    linkAgendamento: "https://example.com/agendar",
    linkResultado: "https://example.com/resultado",
  },
} satisfies TemplateEntry;

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0 16px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: "16px",
};

const brand: React.CSSProperties = {
  color: NAVY,
  fontSize: "20px",
  letterSpacing: "4px",
  fontWeight: 700,
  margin: 0,
};

const brandSub: React.CSSProperties = {
  color: GOLD,
  fontSize: "10px",
  letterSpacing: "3px",
  margin: "4px 0 0",
};

const card: React.CSSProperties = {
  backgroundColor: OFFWHITE,
  border: `1px solid ${GOLD}55`,
  borderRadius: "10px",
  padding: "28px 24px",
};

const h2: React.CSSProperties = {
  color: NAVY,
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const itemLista: React.CSSProperties = {
  color: TEXT,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "3px 0",
};

const h1: React.CSSProperties = {

  color: NAVY,
  fontSize: "22px",
  lineHeight: "30px",
  margin: "0 0 6px",
};

const paragraph: React.CSSProperties = {
  color: TEXT,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "10px 0",
};

const scoreBox: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: `1px solid ${GOLD}55`,
  borderRadius: "8px",
  padding: "18px",
  margin: "18px 0",
  textAlign: "center",
};

const scoreLabel: React.CSSProperties = {
  color: TEXT,
  fontSize: "10px",
  letterSpacing: "2px",
  margin: "0 0 4px",
};

const scoreValue: React.CSSProperties = {
  color: NAVY,
  fontSize: "40px",
  fontWeight: 700,
  margin: "0 0 12px",
};

const perfil: React.CSSProperties = {
  color: NAVY,
  fontSize: "16px",
  fontWeight: 700,
  margin: 0,
};

const sectionTitle: React.CSSProperties = {
  color: GOLD,
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const dimLinha: React.CSSProperties = {
  color: TEXT,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
};

const hr: React.CSSProperties = {
  borderColor: `${GOLD}44`,
  margin: "22px 0",
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: NAVY,
  color: "#ffffff",
  padding: "14px 26px",
  borderRadius: "6px",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};

const btnSecondary: React.CSSProperties = {
  color: NAVY,
  border: `1px solid ${NAVY}`,
  padding: "12px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  color: "#8a8a8a",
  fontSize: "11px",
  lineHeight: "18px",
  textAlign: "center",
  marginTop: "20px",
};
