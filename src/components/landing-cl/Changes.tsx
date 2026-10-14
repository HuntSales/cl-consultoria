import { Reveal } from "@/components/landing-escala360/Reveal";

const ITEMS: [string, string, string][] = [
  ["📈", "Resultado que se sustenta", "A mudança que começa na causa não desmorona no primeiro tropeço."],
  ["🧠", "Clareza sobre suas decisões", "Você entende por que decide e o que decide com o dinheiro."],
  ["⚙️", "Estrutura no lugar do caos", "Método e processo substituem o improviso, na vida e no negócio."],
  ["🤖", "Velocidade com IA", "A tecnologia acelera o que antes dependia só de força de vontade."],
];

export function Changes() {
  return (
    <section className="results">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>O que muda</span>
          </div>
          <h2 className="display results-title">
            RESULTADO QUE VEM DA <span style={{ color: "var(--orange)" }}>RAIZ</span> NÃO REGRIDE.
          </h2>
        </Reveal>
        <div className="results-grid">
          {ITEMS.map(([icon, title, text], i) => (
            <Reveal key={title} delay={i * 80} className="result-card">
              <div className="result-icon">{icon}</div>
              <div className="result-title">{title}</div>
              <div className="result-text">{text}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
