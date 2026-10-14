import { Fragment } from "react";
import { Reveal } from "@/components/landing-escala360/Reveal";

const STEPS = [
  {
    letter: "R",
    name: "Reconhecer",
    text: "Psicanálise mapeia o padrão mental, as crenças e os gatilhos por trás dos seus resultados. A raiz vem à tona.",
  },
  {
    letter: "A",
    name: "Alinhar",
    text: "O diagnóstico vira objetivo claro e um plano de ação estruturado, alinhado a quem você é.",
  },
  {
    letter: "I",
    name: "Investir",
    text: "Você aprende a direcionar recursos para o que realmente importa, sem impulsos, sem sabotagem e sem repetir padrões.",
  },
  {
    letter: "Z",
    name: "Zelar",
    text: "Zelar é proteger o que você construiu — no pessoal e no empresarial.",
  },
];

export function MethodRaiz() {
  return (
    <section className="method" id="metodo">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>O método</span>
          </div>
          <h2 className="display method-title">
            MÉTODO <span style={{ color: "var(--orange)" }}>RAIZ</span>
          </h2>
          <p className="method-intro">
            Quatro movimentos que levam você do padrão mental ao resultado — com tecnologia acelerando cada etapa.
          </p>
        </Reveal>

        <div className="method-core is-raiz">
          {STEPS.map((s, i) => (
            <Fragment key={s.letter}>
              {i > 0 && <div className="method-arrow" aria-hidden="true">→</div>}
              <Reveal delay={i * 100} className="method-core-card">
                <div
                  className="display"
                  style={{
                    fontSize: 88,
                    color: "var(--orange)",
                    lineHeight: 1,
                    marginBottom: 12,
                    textShadow: "0 0 40px var(--orange-glow)",
                  }}
                >
                  {s.letter}
                </div>
                <div className="method-core-name">{s.name}</div>
                <div className="method-core-desc">{s.text}</div>
              </Reveal>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
