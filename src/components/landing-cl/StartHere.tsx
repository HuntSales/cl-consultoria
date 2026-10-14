import { type ReactNode } from "react";
import { Reveal } from "@/components/landing-escala360/Reveal";

const CARDS: { title: string; text: ReactNode; cta: string }[] = [
  {
    title: "Diagnóstico Gratuito",
    text: "Entenda o padrão por trás dos seus resultados.",
    cta: "FAZER DIAGNÓSTICO →",
  },
  {
    title: "Devolutiva Psicanalítica",
    text: "Uma sessão para enxergar a raiz do seu comportamento financeiro.",
    cta: "QUERO MINHA DEVOLUTIVA →",
  },
  {
    title: "Diagnóstico Financeiro",
    text: "Raio X financeiro que te traz clareza sobre o dinheiro com um plano imediato.",
    cta: "QUERO UM DIAGNÓSTICO PERSONALIZADO →",
  },
  {
    title: "Mentorias Financeiras",
    text: "Plano de ação estruturado até o seu objetivo.",
    cta: "CONHECER AS MENTORIAS →",
  },
  {
    title: "Para Seu Negócio",
    text: "Diagnóstico dos sócios, estrutura e automação financeira.",
    cta: "FALAR SOBRE MEU NEGÓCIO →",
  },
  {
    title: "Palestras",
    text: "Saúde financeira e mental para o seu time (apoio à NR-1).",
    cta: "LEVAR PARA MINHA EQUIPE →",
  },
];

export function StartHere() {
  return (
    <section className="deliverables" id="diagnostico">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>Por onde começar</span>
          </div>
          <h2 className="display del-title">
            DÊ O PRIMEIRO PASSO{" "}
            <span style={{ WebkitTextStroke: "2px var(--orange)", color: "transparent" }}>
              NA RAIZ.
            </span>
          </h2>
          <p className="method-intro" style={{ marginBottom: 0 }}>
            Comece pelo diagnóstico. O método te leva até onde você nunca conseguiu ir sozinho.
          </p>
        </Reveal>
        <div
          className="del-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
        >
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 70} className="del-card">
              <div className="del-card-title">{c.title}</div>
              <div className="del-card-text" style={{ marginBottom: 20 }}>
                {c.text}
              </div>
              <a
                href="#diagnostico"
                className="btn-secondary"
                style={{ padding: "12px 22px", fontSize: 13 }}
              >
                {c.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
