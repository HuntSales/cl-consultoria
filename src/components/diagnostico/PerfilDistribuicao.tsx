import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { FatiaPerfil } from "@/lib/perfil-conteudo";

export function PerfilDistribuicao({
  fatias,
  titulo = "Distribuição de pontos por perfil",
}: {
  fatias: FatiaPerfil[];
  titulo?: string;
}) {
  if (fatias.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold uppercase tracking-wide">{titulo}</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] md:items-center">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fatias}
                dataKey="percentual"
                nameKey="titulo"
                cx="50%"
                cy="50%"
                outerRadius="85%"
                isAnimationActive={false}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {fatias.map((f) => (
                  <Cell key={f.id} fill={f.cor} />
                ))}
              </Pie>
              <Tooltip
                formatter={(valor: number, nome: string) => [`${valor}%`, nome]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2">
          {fatias.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: f.cor }}
                  aria-hidden="true"
                />
                <span className="truncate text-foreground">{f.titulo}</span>
              </span>
              <span className="font-semibold text-foreground">{f.percentual}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
