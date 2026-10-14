import { Reveal } from "@/components/landing-escala360/Reveal";

const ITEMS: [string, string, string][] = [
  ["01", "Ganha mais e continua no vermelho", "O dinheiro entra e some, e você não sabe explicar por quê."],
  ["02", "Sabe o que precisa fazer — e não faz", "A clareza existe, a execução não vem."],
  ["03", "Gasta para aliviar a ansiedade", "A compra acalma por um instante e cobra depois."],
  ["04", "Evita olhar para os números", "Abrir o extrato dá um aperto, então você adia."],
  ["05", "O financeiro do negócio vive apagando incêndio", "Sem estrutura, tudo é urgência."],
  ["06", "Você e os sócios travam nas decisões de dinheiro", "Falta alinhamento antes da planilha."],
];

export function Recognize() {
  return (
    <section className="problem">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>Soa familiar?</span>
          </div>
          <h2
            className="display"
            style={{ fontSize: "clamp(44px, 7vw, 80px)", color: "var(--white)", marginTop: 12 }}
          >
            Algum desses<br />padrões é seu?
          </h2>
        </Reveal>
        <div className="problem-grid">
          {ITEMS.map(([num, title, text], i) => (
            <Reveal key={num} delay={i * 70} className="problem-item">
              <div className="problem-num">{num}</div>
              <div className="problem-title">{title}</div>
              <div className="problem-text">{text}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
