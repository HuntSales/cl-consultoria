import { Reveal } from "@/components/landing-escala360/Reveal";

const CARDS = [
  ["🎯", "Disciplina que não dura", "O esforço sozinho sempre regride no primeiro imprevisto."],
  ["🧩", "Conhecimento que não vira ação", "Você sabe o que fazer, mas algo invisível te impede de fazer."],
  ["🔁", "O mesmo padrão, em loop", "Muda o salário, muda o cenário e o resultado se repete."],
];

export function Scenario() {
  return (
    <section className="fear">
      <div className="container-x">
        <div className="fear-inner">
          <Reveal>
            <div className="section-label">
              <span className="lbl" style={{ color: "var(--orange)" }}>O cenário real</span>
            </div>
            <h2 className="display fear-title">
              Mais informação <em>não resolve</em> um problema que é comportamental.
            </h2>
            <p className="fear-body">
              Cursos, planilhas, aplicativos, força de vontade. Você já tentou — e voltou ao mesmo lugar.
            </p>
            <p className="fear-body">
              Não é falta de conhecimento. A causa nunca está na conta bancária: está no padrão que te leva a repetir as mesmas escolhas.
            </p>
            <div className="highlight-box">
              <p>
                Ninguém muda a relação com o dinheiro sem antes entender <em>por que se relaciona com ele desse jeito.</em>
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            {CARDS.map(([icon, title, text]) => (
              <div key={title} className="fear-card">
                <div className="fear-card-icon">{icon}</div>
                <div className="fear-card-title">{title}</div>
                <div className="fear-card-text">{text}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
