"use client";

import { useMemo, useState } from "react";
import { clientes } from "@/lib/data";
import type { Cliente, MetricaMensual, Plan } from "@/lib/types";
import { citasIA } from "@/lib/types";
import { fmtNum, fmtARS, fmtMes, delta } from "@/lib/format";
import { SERIES } from "@/lib/palette";
import { Kpi, PageHeader } from "@/components/ui";
import ChartCard from "@/components/charts/ChartCard";
import StackedColumns from "@/components/charts/StackedColumns";
import HBars from "@/components/charts/HBars";
import LineChart from "@/components/charts/LineChart";

type FiltroPlan = "Todos" | Plan;

// Solo cuentas activas alimentan los gráficos (los prospectos aún no tienen
// histórico). El color se asigna por entidad sobre la lista completa y se
// mantiene al filtrar: un cliente nunca cambia de color.
const activos = clientes.filter((c) => c.estado === "activo");
const colorDe = new Map<string, string>(
  activos.map((c, i) => [c.id, SERIES[i % SERIES.length]]),
);

const meses = [...new Set(activos.flatMap((c) => c.historico.map((h) => h.mes)))].sort();

function metricaDe(c: Cliente, mes: string): MetricaMensual | undefined {
  return c.historico.find((h) => h.mes === mes);
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export default function AnalyticsPage() {
  const [plan, setPlan] = useState<FiltroPlan>("Todos");

  const visibles = useMemo(
    () => activos.filter((c) => plan === "Todos" || c.plan === plan),
    [plan],
  );

  const labels = meses.map(fmtMes);
  const mesActual = meses[meses.length - 1];
  const mesPrevio = meses[meses.length - 2];

  // --- KPIs del mes (scopeados por el filtro) ---
  const kpi = useMemo(() => {
    const act = visibles.map((c) => metricaDe(c, mesActual));
    const prev = visibles.map((c) => metricaDe(c, mesPrevio));
    return {
      resenas: delta(
        sum(act.map((m) => m?.resenasNuevas ?? 0)),
        sum(prev.map((m) => m?.resenasNuevas ?? 0)),
      ),
      resenasActual: sum(act.map((m) => m?.resenasNuevas ?? 0)),
      citas: delta(sum(act.map(citasIA)), sum(prev.map(citasIA))),
      citasActual: sum(act.map(citasIA)),
      visitas: delta(
        sum(act.map((m) => m?.visitasPerfil ?? 0)),
        sum(prev.map((m) => m?.visitasPerfil ?? 0)),
      ),
      visitasActual: sum(act.map((m) => m?.visitasPerfil ?? 0)),
      localPack: act.filter((m) => m !== undefined && m.posicionMaps <= 3).length,
    };
  }, [visibles, mesActual, mesPrevio]);

  // --- Series por gráfico ---
  const seriesResenas = visibles.map((c) => ({
    name: c.nombre,
    color: colorDe.get(c.id)!,
    values: meses.map((m) => metricaDe(c, m)?.resenasNuevas ?? 0),
  }));

  const premium = visibles.filter((c) => c.plan === "Premium");
  const seriesIA = [
    { name: "ChatGPT", key: "citasChatGPT" as const, color: SERIES[0] },
    { name: "Copilot", key: "citasCopilot" as const, color: SERIES[1] },
    { name: "Perplexity", key: "citasPerplexity" as const, color: SERIES[2] },
  ].map((p) => ({
    name: p.name,
    color: p.color,
    values: meses.map((m) =>
      sum(premium.map((c) => metricaDe(c, m)?.[p.key] ?? 0)),
    ),
  }));

  const visitasTotales = meses.map((m) =>
    sum(visibles.map((c) => metricaDe(c, m)?.visitasPerfil ?? 0)),
  );

  const posiciones = visibles
    .map((c) => ({
      label: c.nombre,
      value: metricaDe(c, mesActual)?.posicionMaps ?? 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => a.value - b.value);

  const nfcPorFormato = useMemo(() => {
    const acc = new Map<string, number>();
    for (const c of visibles) {
      for (const v of c.ventasNFC) {
        acc.set(v.formato, (acc.get(v.formato) ?? 0) + v.cantidad * v.precioUnitario);
      }
    }
    return [...acc.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [visibles]);

  const deltaKpi = (d: ReturnType<typeof delta>) => ({
    dir: d.dir,
    text:
      d.pct !== null
        ? `${d.valor >= 0 ? "+" : ""}${d.pct.toFixed(0)}% vs ${fmtMes(mesPrevio)}`
        : `${d.valor >= 0 ? "+" : ""}${d.valor}`,
    good: d.dir === "up",
  });

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={`Evolución de la cartera · ${fmtMes(meses[0])} – ${fmtMes(mesActual)} · solo cuentas activas`}
      />

      {/* Fila de filtros: una sola, arriba, scopea todo lo de abajo */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Plan
        </span>
        {(["Todos", "Base", "Premium"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlan(p)}
            aria-pressed={plan === p}
            className={
              plan === p
                ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
            }
          >
            {p}
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-400">
          {visibles.length} {visibles.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Reseñas nuevas (mes)"
          value={fmtNum(kpi.resenasActual)}
          delta={deltaKpi(kpi.resenas)}
        />
        <Kpi
          label="Citaciones en IA (mes)"
          value={fmtNum(kpi.citasActual)}
          delta={deltaKpi(kpi.citas)}
          hint={plan === "Base" ? "solo planes Premium" : undefined}
        />
        <Kpi
          label="Visitas al perfil (mes)"
          value={fmtNum(kpi.visitasActual)}
          delta={deltaKpi(kpi.visitas)}
        />
        <Kpi
          label="En el Local Pack"
          value={`${kpi.localPack} de ${visibles.length}`}
          hint="posición ≤ #3 en Maps"
        />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Reseñas nuevas por mes"
          subtitle="Aporte de cada cliente al total de la cartera"
          legend={seriesResenas.map((s) => ({
            label: s.name,
            color: s.color,
            mark: "rect",
          }))}
          table={{
            head: ["Cliente", ...labels],
            rows: seriesResenas.map((s) => [s.name, ...s.values.map(fmtNum)]),
          }}
        >
          <StackedColumns labels={labels} series={seriesResenas} format={fmtNum} />
        </ChartCard>

        <ChartCard
          title="Citaciones en IA por plataforma"
          subtitle={
            premium.length > 0
              ? `Recomendaciones a clientes Premium (${premium.length})`
              : "Sin clientes Premium en el filtro actual"
          }
          legend={seriesIA.map((s) => ({
            label: s.name,
            color: s.color,
            mark: "rect",
          }))}
          table={{
            head: ["Plataforma", ...labels],
            rows: seriesIA.map((s) => [s.name, ...s.values.map(fmtNum)]),
          }}
        >
          <StackedColumns labels={labels} series={seriesIA} format={fmtNum} />
        </ChartCard>

        <ChartCard
          title="Visitas al perfil de Google"
          subtitle="Total mensual de la cartera filtrada"
          table={{
            head: ["Mes", "Visitas"],
            rows: meses.map((m, i) => [fmtMes(m), fmtNum(visitasTotales[i])]),
          }}
        >
          <LineChart
            labels={labels}
            values={visitasTotales}
            color={SERIES[0]}
            format={fmtNum}
          />
        </ChartCard>

        <ChartCard
          title="Posición en Google Maps"
          subtitle={`Ranking actual para la búsqueda clave de cada cliente · ${fmtMes(mesActual)} · menos es mejor`}
          table={{
            head: ["Cliente", "Posición"],
            rows: posiciones.map((d) => [d.label, `#${d.value}`]),
          }}
        >
          <HBars
            items={posiciones}
            color={SERIES[0]}
            format={(v) => `#${v}`}
            refValue={3}
            refLabel="Local Pack (≤ #3)"
          />
        </ChartCard>

        <ChartCard
          title="Ingresos por producto NFC"
          subtitle="Acumulado histórico por formato"
          table={{
            head: ["Formato", "Ingresos"],
            rows: nfcPorFormato.map((d) => [d.label, fmtARS(d.value)]),
          }}
        >
          <HBars
            items={nfcPorFormato}
            color={SERIES[0]}
            format={(v) => fmtARS(v)}
          />
        </ChartCard>
      </div>
    </div>
  );
}
