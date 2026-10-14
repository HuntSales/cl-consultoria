import type { ConteudoPerfil } from "@/lib/perfil-conteudo";

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">{titulo}</h3>
      <ul className="mt-2 space-y-1.5">
        {itens.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PerfilConteudo({
  conteudo,
  perfilTitulo,
}: {
  conteudo: ConteudoPerfil | null;
  perfilTitulo?: string | null;
}) {
  if (!conteudo) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold uppercase">
        {perfilTitulo ? `Perfil ${perfilTitulo}` : "Seu perfil"}
      </h2>

      <div className="mt-5 space-y-6">
        {conteudo.comoSeRelaciona && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">
              Como você se relaciona com o dinheiro
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{conteudo.comoSeRelaciona}</p>
          </div>
        )}

        {(conteudo.interpretacao || conteudo.crencas.length > 0) && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">
              Interpretação psicanalítica
            </h3>
            {conteudo.interpretacao && (
              <p className="mt-2 text-sm leading-relaxed text-foreground">{conteudo.interpretacao}</p>
            )}
            {conteudo.crencas.length > 0 && (
              <>
                <p className="mt-3 text-sm font-semibold text-foreground">Crenças inconscientes</p>
                <ul className="mt-1 space-y-1">
                  {conteudo.crencas.map((c) => (
                    <li key={c} className="text-sm italic leading-relaxed text-foreground">
                      “{c}”
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <Lista titulo="Pontos fortes" itens={conteudo.pontosFortes} />
        <Lista titulo="Pontos de melhoria" itens={conteudo.pontosMelhoria} />
        <Lista titulo="Riscos do comportamento" itens={conteudo.riscos} />
        <Lista titulo="Estratégias para evolução" itens={conteudo.estrategias} />
      </div>
    </section>
  );
}
