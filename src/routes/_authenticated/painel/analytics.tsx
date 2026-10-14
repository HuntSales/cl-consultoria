import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { obterAnalytics, obterFunilDiagnosticos } from "@/lib/analytics.functions";

const analyticsQuery = queryOptions({
  queryKey: ["analytics"],
  queryFn: () => obterAnalytics(),
});

const funilQuery = (dias: number) =>
  queryOptions({
    queryKey: ["analytics", "funil-preenchimento", dias],
    queryFn: () => obterFunilDiagnosticos({ data: { dias } }),
  });

export const Route = createFileRoute("/_authenticated/painel/analytics")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(analyticsQuery);
  },
  component: AnalyticsPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Nada por aqui.</p>,
});

const CORES = ["#d0b266", "#05AA7B", "#284356", "#051d40", "#a98f4a", "#7fa8a0"];

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function diaCurto(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function cortar(texto: string, max: number) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

type FatiaLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
  percent: number;
};

function renderFatiaLabel(props: unknown) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value, percent } = props as FatiaLabelProps;
  if (percent < 0.05) return null;
  const raio = innerRadius + (outerRadius - innerRadius) / 2;
  const rad = (-midAngle * Math.PI) / 180;
  const x = cx + raio * Math.cos(rad);
  const y = cy + raio * Math.sin(rad);
  return (
    <text x={x} y={y} fill="#ffffff" fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="central">
      {value}
    </text>
  );
}



function Kpi({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-[11px] uppercase tracking-[0.18em]">{titulo}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{valor}</p>
        {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
      </CardContent>
    </Card>
  );
}

const PERIODOS = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
  { label: "Tudo", dias: 0 },
];

function FunilPreenchimento() {
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useQuery(funilQuery(dias));
  const total = data?.total;
  const linhas = data?.porDiagnostico ?? [];

  const maiorAbandono = (() => {
    if (!total || total.aberturas === 0) return null;
    const quedas = [
      { etapa: "abriram e não começaram", valor: total.aberturas - total.iniciados },
      { etapa: "começaram e não terminaram as perguntas", valor: total.iniciados - total.dados },
      { etapa: "chegaram nos dados e não enviaram", valor: total.dados - total.concluidos },
    ].sort((a, b) => b.valor - a.valor)[0];
    if (!quedas || quedas.valor <= 0) return null;
    return `${Math.round((quedas.valor / total.aberturas) * 100)}% ${quedas.etapa}`;
  })();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Funil de preenchimento</CardTitle>
          <CardDescription>
            Quantas pessoas abriram cada diagnóstico e quantas concluíram o preenchimento.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Button
              key={p.dias}
              size="sm"
              variant={p.dias === dias ? "default" : "outline"}
              onClick={() => setDias(p.dias)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !total || total.aberturas === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há aberturas registradas neste período. A medição começa a contar a partir dos
            novos acessos aos links dos diagnósticos.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi titulo="Aberturas" valor={String(total.aberturas)} detalhe="Abriram o link" />
              <Kpi titulo="Iniciaram" valor={String(total.iniciados)} detalhe="Responderam ao menos 1" />
              <Kpi titulo="Chegaram nos dados" valor={String(total.dados)} detalhe="Terminaram as perguntas" />
              <Kpi
                titulo="Concluíram"
                valor={String(total.concluidos)}
                detalhe={`${total.taxaConclusao}% de conclusão`}
              />
            </div>

            {maiorAbandono ? (
              <p className="text-sm text-muted-foreground">
                Maior abandono: <span className="font-medium text-foreground">{maiorAbandono}</span>.
              </p>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Diagnóstico</th>
                    <th className="py-2 pr-3 font-medium">Aberturas</th>
                    <th className="py-2 pr-3 font-medium">Iniciaram</th>
                    <th className="py-2 pr-3 font-medium">Nos dados</th>
                    <th className="py-2 pr-3 font-medium">Concluíram</th>
                    <th className="py-2 pr-3 font-medium">Conclusão</th>
                    <th className="py-2 font-medium">Abandono</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.diagnosticoId} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{l.titulo}</td>
                      <td className="py-2 pr-3">{l.aberturas}</td>
                      <td className="py-2 pr-3">{l.iniciados}</td>
                      <td className="py-2 pr-3">{l.dados}</td>
                      <td className="py-2 pr-3">{l.concluidos}</td>
                      <td className="py-2 pr-3 font-semibold text-[#05AA7B]">{l.taxaConclusao}%</td>
                      <td className="py-2 text-muted-foreground">{l.taxaAbandono}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsPage() {
  const { data } = useSuspenseQuery(analyticsQuery);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold uppercase">Indicadores do diagnóstico</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Conversão do funil, score médio por dimensão, distribuição de perfis e evolução de respostas
          nos últimos 30 dias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi titulo="Respostas" valor={String(data.totalRespostas)} detalhe={`${data.respostas30d} nos últimos 30 dias`} />
        <Kpi titulo="Ganhos" valor={String(data.totalClientes)} />
        <Kpi titulo="Conversão" valor={`${data.taxaConversao}%`} detalhe="Respostas marcadas como ganho" />
        <Kpi titulo="Score médio" valor={`${data.scoreMedio}%`} />
        <Kpi titulo="Pipeline" valor={moeda(data.valorPipeline)} detalhe="Valor estimado ativo" />
      </div>

      <FunilPreenchimento />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil por etapa</CardTitle>
            <CardDescription>Leads em cada etapa do CRM.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.porEtapa} layout="vertical" margin={{ left: 8, right: 28 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  fontSize={11}
                  tickFormatter={(v: string) => cortar(v, 20)}
                />
                <Tooltip cursor={{ opacity: 0.08 }} />
                <Bar dataKey="total" name="Leads" fill="#d0b266" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="total" position="right" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de perfis</CardTitle>
            <CardDescription>Perfil de resultado das respostas.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.porPerfil.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem respostas.</p>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.porPerfil}
                        dataKey="total"
                        nameKey="perfil"
                        innerRadius={50}
                        outerRadius={88}
                        paddingAngle={2}
                        labelLine={false}
                        label={renderFatiaLabel}
                      >
                        {data.porPerfil.map((p, i) => (
                          <Cell key={p.perfil} fill={p.cor ?? CORES[i % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor: number, nome: string) => {
                          const totalGeral = data.porPerfil.reduce((s, p) => s + p.total, 0);
                          const pct = totalGeral === 0 ? 0 : Math.round((valor / totalGeral) * 100);
                          return [`${valor} (${pct}%)`, nome];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {data.porPerfil.map((p, i) => (
                    <li key={p.perfil} className="flex min-w-0 items-center gap-2 text-xs" title={p.perfil}>
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.cor ?? CORES[i % CORES.length] }}
                      />
                      <span className="truncate text-muted-foreground">{p.perfil}</span>
                      <span className="ml-auto shrink-0 font-medium">{p.total}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score médio por dimensão</CardTitle>
            <CardDescription>Da mais frágil para a mais madura.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.porDimensao.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem respostas.</p>
            ) : (
              <div style={{ height: Math.max(200, data.porDimensao.length * 46 + 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.porDimensao}
                    layout="vertical"
                    margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="dimensao"
                      width={170}
                      fontSize={11}
                      tickFormatter={(v: string) => cortar(v, 24)}
                    />
                    <Tooltip
                      cursor={{ opacity: 0.08 }}
                      formatter={(valor: number) => [`${valor}%`, "Score médio"]}
                    />
                    <Bar dataKey="media" name="Score médio" fill="#05AA7B" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="media"
                        position="right"
                        fontSize={11}
                        formatter={(v: number) => `${v}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respostas nos últimos 30 dias</CardTitle>
            <CardDescription>Volume diário de diagnósticos concluídos.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolucao} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="dia" tickFormatter={diaCurto} fontSize={10} interval={4} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip labelFormatter={(v) => diaCurto(String(v))} />
                <Line type="monotone" dataKey="total" name="Respostas" stroke="#051d40" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por diagnóstico</CardTitle>
          <CardDescription>Volume de respostas e score médio.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.porDiagnostico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem respostas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Diagnóstico</th>
                    <th className="py-2 pr-4 font-medium">Respostas</th>
                    <th className="py-2 font-medium">Score médio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.porDiagnostico.map((d) => (
                    <tr key={d.titulo} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4">{d.titulo}</td>
                      <td className="py-2 pr-4">{d.total}</td>
                      <td className="py-2">{d.scoreMedio}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
