import { useState, type ReactNode } from "react";
import { Reveal } from "@/components/landing-escala360/Reveal";

type Block = { num: string; tag: string; title: string; body: ReactNode };

const BLOCKS: Block[] = [
  {
    num: "01",
    tag: "Para Você",
    title: "Diagnóstico Financeiro Comportamental",
    body: (
      <ul>
        <li>Mapeamento do seu padrão mental com o dinheiro</li>
        <li>Retrato claro de onde você está — e por quê</li>
        <li>Ponto de partida do Método RAIZ</li>
      </ul>
    ),
  },
  {
    num: "02",
    tag: "Para Você",
    title: "Devolutiva Psicanalítica",
    body: (
      <ul>
        <li>A leitura da raiz por trás dos seus resultados</li>
        <li>Onde a emoção sabota a decisão financeira</li>
        <li>Sessão guiada, sem julgamento</li>
      </ul>
    ),
  },
  {
    num: "03",
    tag: "Para Você",
    title: "Diagnóstico Financeiro",
    body: (
      <ul>
        <li>Raio X da saúde financeira</li>
        <li>Clareza sobre o dinheiro que entra, sai e o que trava</li>
        <li>Um plano de ação imediato</li>
      </ul>
    ),
  },
  {
    num: "04",
    tag: "Para Você",
    title: "Mentorias Financeiras (Essencial e Premium)",
    body: (
      <ul>
        <li>Plano de ação estruturado até o seu objetivo</li>
        <li>Ferramentas para organizar e otimizar suas finanças</li>
        <li>Acompanhamento que transforma decisão em hábito</li>
      </ul>
    ),
  },
  {
    num: "05",
    tag: "Para Seu Negócio",
    title: "Diagnóstico do Empresário e dos Sócios",
    body: (
      <ul>
        <li>Perfil comportamental de quem decide o dinheiro</li>
        <li>Onde o emocional dos sócios trava o financeiro</li>
        <li>Alinhamento das pessoas antes dos números</li>
      </ul>
    ),
  },
  {
    num: "06",
    tag: "Para Seu Negócio",
    title: "Estrutura, Processos e Automação com IA",
    body: (
      <ul>
        <li>Desenho da estrutura organizacional financeira</li>
        <li>Organização e padronização dos processos</li>
        <li>Sistemas, dados e IA para automatizar e decidir com clareza</li>
      </ul>
    ),
  },
];

export function Esteira() {
  const [open, setOpen] = useState(0);

  return (
    <section className="what" id="esteira">
      <div className="container-x">
        <Reveal className="section-header">
          <div className="section-label">
            <span className="lbl" style={{ color: "var(--orange)" }}>A esteira</span>
          </div>
          <h2 className="display what-title">
            ONDE VOCÊ COMEÇA DEPENDE DE <span>ONDE VOCÊ ESTÁ.</span>
          </h2>
          <p className="what-intro">
            Uma jornada pensada para te encontrar — na sua vida ou no seu negócio.
          </p>
        </Reveal>

        <Reveal className="blocks-list">
          {BLOCKS.map((b, i) => {
            const isOpen = open === i;
            return (
              <div
                key={b.num}
                className={`block-item ${isOpen ? "is-open" : ""}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <div className="block-header">
                  <div className="block-num">{b.num}</div>
                  <div className="block-info">
                    <div className="block-tag">{b.tag}</div>
                    <div className="block-title">{b.title}</div>
                  </div>
                  <div className="block-arrow">→</div>
                </div>
                <div className={`block-body ${isOpen ? "is-open" : ""}`}>{b.body}</div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
