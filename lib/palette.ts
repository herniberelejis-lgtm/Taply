// Paleta de visualización (modo claro, superficie blanca de las cards).
// Validada con el validador de 6 checks: ΔE adyacente mínimo 24.2 (protan),
// banda de luminosidad y piso de croma OK. Aqua y amarillo quedan bajo 3:1
// de contraste sobre blanco → regla de relief: cada gráfico expone vista
// tabla y tooltips (nunca color-solo).
//
// Regla dura: los slots se asignan en orden fijo por entidad y NUNCA se
// reasignan al filtrar — el color sigue a la entidad, no a su fila.

export const SERIES = [
  "#2a78d6", // 1 azul
  "#1baf7a", // 2 aqua
  "#eda100", // 3 amarillo
  "#008300", // 4 verde
  "#4a3aa7", // 5 violeta
  "#e34948", // 6 rojo
] as const;

// Chrome del gráfico (tinta y líneas — el texto usa tokens de texto, nunca
// el color de la serie).
export const INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  surface: "#ffffff",
  goodText: "#006300",
} as const;

/** Ticks "lindos" para un eje 0..max: devuelve [0, paso, 2·paso, …]. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  const step = candidates.find((c) => c >= rough) ?? candidates[4];
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}
