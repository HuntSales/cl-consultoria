import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RegraPerfil } from "@/lib/scoring";
import { numerarPerguntas } from "@/lib/scoring";
import type { DimensaoCompleta } from "@/lib/diagnosticos.functions";

/**
 * Editor visual de regras: o admin clica nas letras aceitas de cada pergunta,
 * sem precisar escrever "1: A, B" à mão.
 */
export function RegrasEditor({
  dimensoes,
  regras,
  onChange,
}: {
  dimensoes: DimensaoCompleta[];
  regras: RegraPerfil[];
  onChange: (regras: RegraPerfil[]) => void;
}) {
  const perguntas = useMemo(() => numerarPerguntas(dimensoes), [dimensoes]);

  const selecionadas = (numero: number) =>
    regras.find((r) => r.pergunta === numero)?.opcoes.map((o) => o.toUpperCase()) ?? [];

  function alternar(numero: number, letra: string) {
    const atual = selecionadas(numero);
    const proximas = atual.includes(letra) ? atual.filter((l) => l !== letra) : [...atual, letra].sort();
    const restantes = regras.filter((r) => r.pergunta !== numero);
    onChange(
      proximas.length > 0
        ? [...restantes, { pergunta: numero, opcoes: proximas }].sort((a, b) => a.pergunta - b.pergunta)
        : restantes.sort((a, b) => a.pergunta - b.pergunta),
    );
  }

  if (perguntas.length === 0) {
    return <p className="text-xs text-muted-foreground">Cadastre perguntas com letras para montar regras.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Clique nas respostas que ativam este perfil. {regras.length} pergunta(s) com regra.
        </p>
        {regras.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Limpar regras
          </Button>
        )}
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
        {perguntas.map((perg) => {
          const ativas = selecionadas(perg.numero);
          return (
            <div key={perg.id} className="flex items-start gap-3 rounded px-1 py-1">
              <Badge variant={ativas.length ? "default" : "outline"} className="mt-0.5 shrink-0 text-[10px]">
                P{perg.numero}
              </Badge>
              <span className="flex-1 truncate text-xs text-muted-foreground">{perg.texto}</span>
              <div className="flex shrink-0 gap-1">
                {perg.letras.length === 0 && <span className="text-[10px] text-muted-foreground">sem letras</span>}
                {perg.letras.map((letra) => (
                  <button
                    key={letra}
                    type="button"
                    onClick={() => alternar(perg.numero, letra)}
                    className={`h-6 w-6 rounded border text-[11px] font-semibold transition ${
                      ativas.includes(letra)
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-accent"
                    }`}
                  >
                    {letra}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
