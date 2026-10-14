import { jsPDF } from "jspdf";

import type { Devolutiva } from "./devolutiva.server";
import type { RespostaDetalhe } from "./respostas-admin.functions";

const NAVY = "#051d40";
const NAVY_SUAVE = "#284356";
const GOLD = "#d0b266";
const VERDE = "#05AA7B";
const OFFWHITE = "#f8f6f1";
const CINZA = "#6b7280";

const MARGEM = 16;
const LARGURA = 210;
const ALTURA = 297;
const CONTEUDO = LARGURA - MARGEM * 2;

type Ctx = { doc: jsPDF; y: number };

function novaPagina(ctx: Ctx) {
  ctx.doc.addPage();
  ctx.doc.setFillColor(OFFWHITE);
  ctx.doc.rect(0, 0, LARGURA, ALTURA, "F");
  ctx.y = MARGEM + 8;
}

function garantirEspaco(ctx: Ctx, altura: number) {
  if (ctx.y + altura > ALTURA - 20) novaPagina(ctx);
}

function tituloSecao(ctx: Ctx, texto: string) {
  garantirEspaco(ctx, 18);
  ctx.doc.setFillColor(GOLD);
  ctx.doc.rect(MARGEM, ctx.y - 3.4, 2.2, 5, "F");
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11.5);
  ctx.doc.setTextColor(NAVY);
  ctx.doc.text(texto.toUpperCase(), MARGEM + 5, ctx.y);
  ctx.y += 7;
}

function paragrafo(ctx: Ctx, texto: string, opcoes?: { cor?: string; tamanho?: number; negrito?: boolean }) {
  const tamanho = opcoes?.tamanho ?? 9.5;
  ctx.doc.setFont("helvetica", opcoes?.negrito ? "bold" : "normal");
  ctx.doc.setFontSize(tamanho);
  ctx.doc.setTextColor(opcoes?.cor ?? NAVY_SUAVE);
  const linhas = ctx.doc.splitTextToSize(texto, CONTEUDO) as string[];
  for (const linha of linhas) {
    garantirEspaco(ctx, 6);
    ctx.doc.text(linha, MARGEM, ctx.y);
    ctx.y += tamanho * 0.52;
  }
  ctx.y += 2.5;
}

function itemLista(ctx: Ctx, texto: string, marcador: string, corMarcador: string) {
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(9.5);
  const recuo = 7;
  const linhas = ctx.doc.splitTextToSize(texto, CONTEUDO - recuo) as string[];
  garantirEspaco(ctx, linhas.length * 5 + 2);
  ctx.doc.setTextColor(corMarcador);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text(marcador, MARGEM, ctx.y);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setTextColor(NAVY_SUAVE);
  for (const linha of linhas) {
    garantirEspaco(ctx, 5);
    ctx.doc.text(linha, MARGEM + recuo, ctx.y);
    ctx.y += 4.9;
  }
  ctx.y += 1.6;
}

function barra(ctx: Ctx, rotulo: string, valor: number, cor: string) {
  garantirEspaco(ctx, 13);
  const larguraTrilho = CONTEUDO - 16;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(NAVY);
  const rotuloCurto = (ctx.doc.splitTextToSize(rotulo, CONTEUDO - 18) as string[])[0];
  ctx.doc.text(rotuloCurto, MARGEM, ctx.y);
  ctx.doc.setTextColor(CINZA);
  ctx.doc.text(`${valor}%`, LARGURA - MARGEM, ctx.y, { align: "right" });
  ctx.y += 2.4;

  ctx.doc.setFillColor("#e6e2d8");
  ctx.doc.roundedRect(MARGEM, ctx.y, larguraTrilho, 3.6, 1.8, 1.8, "F");
  const preenchida = Math.max(0, Math.min(100, valor)) / 100;
  if (preenchida > 0) {
    ctx.doc.setFillColor(cor);
    ctx.doc.roundedRect(MARGEM, ctx.y, Math.max(2, larguraTrilho * preenchida), 3.6, 1.8, 1.8, "F");
  }
  ctx.y += 9;
}

function pizza(ctx: Ctx, fatias: RespostaDetalhe["distribuicao"]) {
  if (fatias.length === 0) return;
  const raio = 26;
  const alturaBloco = Math.max(raio * 2 + 8, fatias.length * 6 + 6);
  garantirEspaco(ctx, alturaBloco);

  const cx = MARGEM + raio + 4;
  const cy = ctx.y + raio;
  let anguloAtual = -Math.PI / 2;

  for (const fatia of fatias) {
    const varredura = (Math.max(fatia.percentual, 0) / 100) * Math.PI * 2;
    if (varredura <= 0) continue;
    const passos = Math.max(2, Math.ceil(varredura / 0.12));
    const pontos: [number, number][] = [[cx, cy]];
    for (let i = 0; i <= passos; i += 1) {
      const a = anguloAtual + (varredura * i) / passos;
      pontos.push([cx + Math.cos(a) * raio, cy + Math.sin(a) * raio]);
    }
    const deltas = pontos.slice(1).map((p, i) => [p[0] - pontos[i][0], p[1] - pontos[i][1]] as [number, number]);
    ctx.doc.setFillColor(fatia.cor);
    ctx.doc.setDrawColor(OFFWHITE);
    ctx.doc.lines(deltas, pontos[0][0], pontos[0][1], [1, 1], "F", true);
    anguloAtual += varredura;
  }

  // legenda
  let ly = ctx.y + 4;
  const lx = cx + raio + 10;
  for (const fatia of fatias) {
    ctx.doc.setFillColor(fatia.cor);
    ctx.doc.rect(lx, ly - 2.6, 3.2, 3.2, "F");
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(NAVY);
    const rotulo = (ctx.doc.splitTextToSize(fatia.titulo, LARGURA - MARGEM - lx - 20) as string[])[0];
    ctx.doc.text(rotulo, lx + 5, ly);
    ctx.doc.setTextColor(CINZA);
    ctx.doc.text(`${fatia.percentual}%`, LARGURA - MARGEM, ly, { align: "right" });
    ly += 6;
  }

  ctx.y += alturaBloco;
}

function secaoLista(ctx: Ctx, titulo: string, itens: string[]) {
  if (itens.length === 0) return;
  tituloSecao(ctx, titulo);
  itens.forEach((i) => itemLista(ctx, i, "•", GOLD));
  ctx.y += 2;
}



function capa(ctx: Ctx, resposta: RespostaDetalhe) {
  const doc = ctx.doc;
  doc.setFillColor(NAVY);
  doc.rect(0, 0, LARGURA, 62, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, 62, LARGURA, 1.6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(GOLD);
  doc.text("CIBELE LUCENA · CONSULTORIA FINANCEIRA", MARGEM, 18);

  doc.setFontSize(19);
  doc.setTextColor("#ffffff");
  doc.text("BRIEFING DE DEVOLUTIVA", MARGEM, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(resposta.nome, MARGEM, 41);

  doc.setFontSize(8.5);
  doc.setTextColor("#c7d0dd");
  doc.text(
    `${resposta.diagnosticoTitulo} · ${new Date(resposta.criadoEm).toLocaleDateString("pt-BR")}`,
    MARGEM,
    48,
  );
  doc.text([resposta.email, resposta.whatsapp].filter(Boolean).join(" · "), MARGEM, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(GOLD);
  doc.text(`${resposta.scorePercentual}%`, LARGURA - MARGEM, 33, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor("#c7d0dd");
  doc.text("APROVEITAMENTO GERAL", LARGURA - MARGEM, 39, { align: "right" });

  ctx.y = 76;
}

function rodapes(doc: jsPDF, nome: string) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor("#e0dcd2");
    doc.line(MARGEM, ALTURA - 14, LARGURA - MARGEM, ALTURA - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(CINZA);
    doc.text(`Briefing de devolutiva · ${nome}`, MARGEM, ALTURA - 9);
    doc.text(`${i}/${total}`, LARGURA - MARGEM, ALTURA - 9, { align: "right" });
  }
}

export function gerarPdfDevolutiva(resposta: RespostaDetalhe, devolutiva: Devolutiva) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(OFFWHITE);
  doc.rect(0, 0, LARGURA, ALTURA, "F");
  const ctx: Ctx = { doc, y: MARGEM };

  capa(ctx, resposta);

  // Perfil
  if (resposta.perfilTitulo) {
    tituloSecao(ctx, "Perfil identificado");
    paragrafo(ctx, resposta.perfilTitulo, { negrito: true, tamanho: 11, cor: NAVY });
    if (resposta.perfilDescricao) paragrafo(ctx, resposta.perfilDescricao);
    ctx.y += 2;
  }

  const conteudo = resposta.perfilConteudo;
  if (conteudo) {
    if (conteudo.comoSeRelaciona) {
      tituloSecao(ctx, "Como você se relaciona com o dinheiro");
      paragrafo(ctx, conteudo.comoSeRelaciona);
    }
    if (conteudo.interpretacao || conteudo.crencas.length > 0) {
      tituloSecao(ctx, "Interpretação psicanalítica");
      if (conteudo.interpretacao) paragrafo(ctx, conteudo.interpretacao);
      if (conteudo.crencas.length > 0) {
        paragrafo(ctx, "Crenças inconscientes", { negrito: true, cor: NAVY });
        conteudo.crencas.forEach((c) => itemLista(ctx, `“${c}”`, "•", NAVY_SUAVE));
        ctx.y += 2;
      }
    }
    secaoLista(ctx, "Pontos fortes", conteudo.pontosFortes);
    secaoLista(ctx, "Pontos de melhoria", conteudo.pontosMelhoria);
    secaoLista(ctx, "Riscos do comportamento", conteudo.riscos);
    secaoLista(ctx, "Estratégias para evolução", conteudo.estrategias);
  }

  // Distribuição por perfil
  if (resposta.distribuicao.length > 1) {
    tituloSecao(ctx, "Distribuição de pontos por perfil");
    pizza(ctx, resposta.distribuicao);
    ctx.y += 2;
  }

  // Gráficos
  tituloSecao(ctx, "Panorama do diagnóstico");
  barra(ctx, "Pontuação geral", resposta.scorePercentual, GOLD);
  if (resposta.dimensoes.length > 0) {
    const ordenadas = resposta.dimensoes.slice().sort((a, b) => a.scorePercentual - b.scorePercentual);
    for (const d of ordenadas) {
      barra(ctx, d.titulo, Math.round(d.scorePercentual), d.scorePercentual >= 60 ? VERDE : NAVY_SUAVE);
    }
  }
  ctx.y += 2;


  tituloSecao(ctx, "Foco principal da devolutiva");
  paragrafo(ctx, devolutiva.focoPrincipal || "Sem foco definido.");
  ctx.y += 2;

  if (devolutiva.pontosAbordar.length > 0) {
    tituloSecao(ctx, "Pontos a abordar");
    devolutiva.pontosAbordar.forEach((p, i) => itemLista(ctx, p, `${i + 1}.`, GOLD));
    ctx.y += 2;
  }

  if (devolutiva.perguntasAprofundamento.length > 0) {
    tituloSecao(ctx, "Perguntas de aprofundamento");
    devolutiva.perguntasAprofundamento.forEach((p) => itemLista(ctx, p, "?", NAVY_SUAVE));
    ctx.y += 2;
  }

  if (devolutiva.alertas.length > 0) {
    tituloSecao(ctx, "Cuidados de abordagem");
    devolutiva.alertas.forEach((a) => itemLista(ctx, a, "!", "#b3261e"));
    ctx.y += 2;
  }

  if (devolutiva.planoAcao.length > 0) {
    tituloSecao(ctx, "Plano de ação 90 dias");
    for (const prazo of ["30 dias", "60 dias", "90 dias"] as const) {
      const acoes = devolutiva.planoAcao.filter((a) => a.prazo === prazo);
      if (acoes.length === 0) continue;
      garantirEspaco(ctx, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(VERDE);
      doc.text(prazo.toUpperCase(), MARGEM, ctx.y);
      ctx.y += 5;
      acoes.forEach((a) => itemLista(ctx, a.acao, "•", VERDE));
      ctx.y += 1;
    }
  }

  // Anexo com as respostas
  if (resposta.itens.length > 0) {
    novaPagina(ctx);
    tituloSecao(ctx, "Anexo · Respostas do questionário");
    for (const item of resposta.itens) {
      const perguntaLinhas = doc.splitTextToSize(item.perguntaTexto, CONTEUDO - 6) as string[];
      const respostaLinhas = doc.splitTextToSize(
        `${item.opcaoTexto}  (${item.pesoAplicado} pts)`,
        CONTEUDO - 6,
      ) as string[];
      garantirEspaco(ctx, (perguntaLinhas.length + respostaLinhas.length) * 4.8 + 10);

      if (item.dimensaoTitulo) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(GOLD);
        doc.text(item.dimensaoTitulo.toUpperCase(), MARGEM, ctx.y);
        ctx.y += 4.2;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(NAVY);
      for (const linha of perguntaLinhas) {
        doc.text(linha, MARGEM, ctx.y);
        ctx.y += 4.6;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(NAVY_SUAVE);
      for (const linha of respostaLinhas) {
        doc.text(linha, MARGEM, ctx.y);
        ctx.y += 4.6;
      }
      ctx.y += 3;
      doc.setDrawColor("#e0dcd2");
      doc.line(MARGEM, ctx.y - 1.5, LARGURA - MARGEM, ctx.y - 1.5);
      ctx.y += 3;
    }
  }

  rodapes(doc, resposta.nome);

  const slug = resposta.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "");
  doc.save(`devolutiva-${slug || "diagnostico"}.pdf`);
}
