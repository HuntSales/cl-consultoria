const ITEMS = [
  "FINANÇAS COMEÇAM NA MENTE",
  "DA RAIZ AO RESULTADO",
  "MÉTODO, NÃO ACHISMO",
  "PSICANÁLISE APLICADA AO DINHEIRO",
  "IA QUE ACELERA, MÉTODO QUE SUSTENTA",
];

export function Marquee() {
  const all = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker">
        {all.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 60 }}>
            {t}
            <span className="ticker-dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
