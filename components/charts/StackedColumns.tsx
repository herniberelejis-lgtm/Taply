"use client";

import { useState } from "react";
import { INK, niceTicks } from "@/lib/palette";
import Tooltip from "./Tooltip";

export interface ColumnSeries {
  name: string;
  color: string;
  values: number[]; // una por etiqueta
}

// Columnas apiladas. Marcas finas (≤24 de ancho), extremo superior redondeado
// 4px anclado a la base, separador de 2px en color de superficie entre
// segmentos. Hover/focus por columna: un tooltip lista TODAS las series.
export default function StackedColumns({
  labels,
  series,
  format = (v) => String(v),
}: {
  labels: string[];
  series: ColumnSeries[];
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 250;
  const M = { top: 10, right: 8, bottom: 24, left: 40 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const GAP = 2; // separador en color de superficie

  const totals = labels.map((_, i) =>
    series.reduce((acc, s) => acc + (s.values[i] ?? 0), 0),
  );
  const ticks = niceTicks(Math.max(...totals, 1));
  const maxY = ticks[ticks.length - 1];
  const y = (v: number) => M.top + plotH - (v / maxY) * plotH;
  const band = plotW / labels.length;
  const barW = Math.min(24, band * 0.55);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de columnas apiladas"
      >
        {/* grilla + ticks Y (hairline sólida, recesiva) */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? INK.axis : INK.grid}
              strokeWidth={1}
            />
            <text
              x={M.left - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={10}
              fill={INK.muted}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {format(t)}
            </text>
          </g>
        ))}

        {labels.map((label, i) => {
          const cx = M.left + band * i + band / 2;
          const x0 = cx - barW / 2;
          let cursor = 0; // acumulado
          const topIdx = [...series]
            .map((s, k) => ((s.values[i] ?? 0) > 0 ? k : -1))
            .filter((k) => k >= 0)
            .pop();

          return (
            <g key={label}>
              {series.map((s, k) => {
                const v = s.values[i] ?? 0;
                if (v <= 0) return null;
                const yTop = y(cursor + v);
                const yBot = y(cursor);
                cursor += v;
                const isTop = k === topIdx;
                const gapTop = isTop ? 0 : GAP;
                const h = yBot - yTop - gapTop;
                if (h < 0.75) return null;
                if (isTop) {
                  const r = Math.min(4, h / 2, barW / 2);
                  return (
                    <path
                      key={s.name}
                      d={`M ${x0} ${yTop + r} Q ${x0} ${yTop} ${x0 + r} ${yTop} L ${x0 + barW - r} ${yTop} Q ${x0 + barW} ${yTop} ${x0 + barW} ${yTop + r} L ${x0 + barW} ${yBot} L ${x0} ${yBot} Z`}
                      fill={s.color}
                    />
                  );
                }
                return (
                  <rect
                    key={s.name}
                    x={x0}
                    y={yTop + gapTop}
                    width={barW}
                    height={h}
                    fill={s.color}
                  />
                );
              })}

              {/* etiqueta X */}
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill={INK.muted}
              >
                {label}
              </text>

              {/* hit target: toda la banda, más grande que la marca */}
              <rect
                x={M.left + band * i}
                y={M.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${label}: total ${format(totals[i])}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                style={{ outline: "none" }}
              />
              {hover === i && (
                <rect
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill={INK.primary}
                  opacity={0.04}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <Tooltip
          title={labels[hover]}
          leftPct={((M.left + band * hover + band / 2) / W) * 100}
          topPct={(y(totals[hover]) / H) * 100}
          rows={[
            ...series
              .filter((s) => (s.values[hover] ?? 0) > 0)
              .map((s) => ({
                label: s.name,
                value: format(s.values[hover] ?? 0),
                color: s.color,
              })),
            { label: "Total", value: format(totals[hover]) },
          ]}
        />
      )}
    </div>
  );
}
