import { Reveal } from "@/components/landing-escala360/Reveal";

const PAIRS: [string, string][] = [
  [
    "Finanças é só disciplina e planilha.",
    "Comportamento financeiro tem raiz emocional. É lá que o método começa.",
  ],
  [
    "Já tentei de tudo. O problema sou eu.",
    "O problema é um padrão que nunca foi compreendido. Padrão se enxerga — e se reescreve.",
  ],
  [
    "Psicanálise não tem nada a ver com dinheiro.",
    "É exatamente o que revela por que você repete escolhas que sabe que te prejudicam.",
  ],
  [
    "IA vai me afastar do meu dinheiro.",
    "A IA te dá clareza e acelera a execução. Você decide melhor, não menos.",
  ],
];

export function Beliefs() {
  return (
    <section className="beliefs">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>Quebrando crenças</span>
          </div>
          <h2 className="display beliefs-title">
            O que te disseram sobre dinheiro <em>vs.</em> o que é verdade.
          </h2>
          <p className="beliefs-sub">
            As crenças que te mantêm no mesmo lugar — e a leitura que liberta.
          </p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PAIRS.map(([before, after]) => (
            <Reveal key={before} className="belief-flip">
              <div className="belief-before">
                <div className="belief-tag">❌ Crença limitante</div>
                <div className="belief-text">{before}</div>
              </div>
              <div className="belief-after">
                <div className="belief-tag">✅ A realidade</div>
                <div className="belief-text">{after}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
