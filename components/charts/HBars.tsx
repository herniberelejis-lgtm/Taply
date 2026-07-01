"use client";

import { useState } from "react";
import { INK, niceTicks } from "@/lib/palette";
import Tooltip from "./Tooltip";

export interface HBarItem {
  label: string;
  value: number;
}

// Barras horizontales de una sola serie (categorías nominales → un solo tono,
// nunca un degradé por valor). Barra ≤20 de grosor, extremo redondeado 4px,
// base cuadrada. Valor directo en la punta. Línea de referencia opcional.
export default function HBars({
  items,
  color,
  format = (v) => String(v),
  refValue,
  refLabel,
}: {
  items: HBarItem[];
  color: string;
  format?: (v: number) => string;
  refValue?: number;
  refLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const ROW = 42; // etiqueta arriba + barra abajo
  const M = { top: refLabel ? 18 : 8, right: 56, bottom: 20, left: 8 };
  const H = M.top + items.length * ROW + M.bottom;
  const plotW = W - M.left - M.right;

  const ticks = niceTicks(Math.max(...items.map((d) => d.value), refValue ?? 0, 1));
  const maxX = ticks[ticks.length - 1];
  const x = (v: number) => M.left + (v / maxX) * plotW;
  const BAR = 14;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de barras horizontales"
      >
        {/* grilla vertical */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={M.top}
              y2={H - M.bottom}
              stroke={t === 0 ? INK.axis : INK.grid}
              strokeWidth={1}
            />
            <text
              x={x(t)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill={INK.muted}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {format(t)}
            </text>
          </g>
        ))}

        {/* línea de referencia (p.ej. Local Pack) */}
        {refValue !== undefined && (
          <g>
            <line
              x1={x(refValue)}
              x2={x(refValue)}
              y1={M.top - 4}
              y2={H - M.bottom}
              stroke={INK.axis}
              strokeWidth={1.5}
            />
            {refLabel && (
              <text
                x={x(refValue) + 5}
                y={M.top - 6}
                fontSize={10}
                fill={INK.secondary}
              >
                {refLabel}
              </text>
            )}
          </g>
        )}

        {items.map((d, i) => {
          const yRow = M.top + i * ROW;
          const yBar = yRow + 20;
          const w = x(d.value) - M.left;
          const r = Math.min(4, w / 2, BAR / 2);
          return (
            <g key={d.label}>
              <text
                x={M.left}
                y={yRow + 12}
                fontSize={11}
                fill={INK.secondary}
              >
                {d.label}
              </text>
              {/* barra: base cuadrada, punta redondeada */}
              <path
                d={`M ${M.left} ${yBar} L ${M.left + w - r} ${yBar} Q ${M.left + w} ${yBar} ${M.left + w} ${yBar + r} L ${M.left + w} ${yBar + BAR - r} Q ${M.left + w} ${yBar + BAR} ${M.left + w - r} ${yBar + BAR} L ${M.left} ${yBar + BAR} Z`}
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
              {/* valor en la punta (tinta, no color de serie) */}
              <text
                x={M.left + w + 6}
                y={yBar + BAR / 2 + 3.5}
                fontSize={11}
                fontWeight={600}
                fill={INK.primary}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {format(d.value)}
              </text>

              {/* hit target de fila completa */}
              <rect
                x={0}
                y={yRow}
                width={W}
                height={ROW}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${format(d.value)}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                style={{ outline: "none" }}
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <Tooltip
          title={items[hover].label}
          leftPct={((x(items[hover].value) + 10) / W) * 100}
          topPct={((M.top + hover * ROW + 18) / H) * 100}
          rows={[{ label: "", value: format(items[hover].value), color }]}
        />
      )}
    </div>
  );
}
