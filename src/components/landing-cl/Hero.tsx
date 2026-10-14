export function Hero() {
  return (
    <section className="hero">
      <div className="hero-vignette" />
      <div className="hero-grid-lines" />
      <div className="container-x">
        <div className="hero-badge">
          <span className="dot" />
          <span className="lbl">PSICANÁLISE · MÉTODO · IA</span>
        </div>
        <h1 className="display hero-title">
          O QUE TRAVA<br />
          <span className="orange">SEU DINHEIRO</span><br />
          <span className="outline">NÃO ESTÁ</span><br />
          NA PLANILHA.
        </h1>
        <p className="hero-subtitle">
          Está nos padrões emocionais que moldam suas decisões, seus comportamentos e seus resultados.
        </p>
        <p className="hero-desc">
          Uma consultoria para quem faz, trabalha, cresce — mas ainda repete ciclos com o dinheiro. Aqui, tratamos o que está por trás das escolhas financeiras: crenças, emoções e padrões que se repetem sem você perceber e depois criamos um plano de ação estruturado e tecnologia para acelerar o caminho até o seu objetivo — Para Você e Para Seu Negócio.
        </p>
        <div className="hero-ctas">
          <a href="#diagnostico" className="btn-primary">
            FAZER DIAGNÓSTICO →
          </a>
          <a href="#metodo" className="btn-secondary">
            CONHECER O MÉTODO RAIZ
          </a>
        </div>
        <div className="hero-stats">
          {[
            ["2", "Verticais: Para Você e Para Seu Negócio"],
            ["4", "Etapas do Método RAIZ"],
            ["IA", "Em cada etapa"],
            ["100%", "Método, não achismo"],
          ].map(([num, label]) => (
            <div key={label} className="hero-stat-card">
              <div className="hero-stat-num">{num}</div>
              <div className="hero-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
