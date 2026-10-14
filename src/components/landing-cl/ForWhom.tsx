import { Reveal } from "@/components/landing-escala360/Reveal";

const ITEMS = [
  "Você ganha bem, mas não consegue fazer o dinheiro sobrar",
  "Você já tentou planilhas e apps, e nada mudou",
  "Você sente que repete os mesmos padrões com dinheiro",
  "Você é empresário e o financeiro do negócio vive no susto",
  "Você e seus sócios travam nas decisões de dinheiro",
  "Você quer método e estrutura, não mais um conteúdo motivacional",
];

export function ForWhom() {
  return (
    <section className="forWho">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>Para quem é</span>
          </div>
          <h2 className="display forWho-title">
            PROVAVELMENTE É <span>PRA VOCÊ</span> SE…
          </h2>
        </Reveal>
        <Reveal className="check-list">
          {ITEMS.map((t) => (
            <div key={t} className="check-item">
              <div className="check-icon">✓</div>
              <div className="check-text">{t}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
