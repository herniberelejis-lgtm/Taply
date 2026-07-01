// Modelo de dominio del dashboard de la agencia (NFC + GEO) — Córdoba.
// Refleja las entidades del documento de proyecto: clientes, reseñas,
// posición en Google Maps, citaciones en IA (GEO) y reportes mensuales.

export type Plan = "Base" | "Premium";

export type EstadoCliente = "activo" | "pausado" | "prospecto" | "baja";

export type Zona =
  | "Güemes"
  | "Nueva Córdoba"
  | "Alberdi"
  | "General Paz"
  | "Cerro de las Rosas"
  | "Otra";

export type Rubro =
  | "Peluquería / Barbería"
  | "Restaurante / Bar"
  | "Clínica / Consultorio"
  | "Taller mecánico"
  | "Veterinaria"
  | "Gimnasio"
  | "Estética"
  | "Otro";

/** Formatos de producto físico NFC (sección 3 del proyecto). */
export type FormatoNFC = "Sticker" | "Tarjeta PVC" | "Standee" | "Pack completo";

/** Una venta de producto físico NFC asociada a un cliente. */
export interface VentaNFC {
  formato: FormatoNFC;
  cantidad: number;
  precioUnitario: number; // ARS
  fecha: string; // ISO
}

/** Snapshot mensual de métricas de un cliente. */
export interface MetricaMensual {
  mes: string; // "2026-06"
  resenasNuevas: number;
  resenasTotal: number;
  ratingPromedio: number; // 1..5
  posicionMaps: number; // ranking en el Local Pack para la búsqueda clave (1 = primero)
  visitasPerfil: number;
  llamadas: number;
  clicsComoLlegar: number;
  // Solo Premium — citaciones en motores de IA (GEO)
  citasChatGPT?: number;
  citasCopilot?: number;
  citasPerplexity?: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  rubro: Rubro;
  zona: Zona;
  plan: Plan;
  estado: EstadoCliente;
  contacto: string; // WhatsApp / teléfono
  fechaAlta: string; // ISO
  googleReviewUrl: string;
  busquedaClave: string; // p.ej. "peluquería en Nueva Córdoba"
  fee: number; // abono mensual ARS
  ventasNFC: VentaNFC[];
  historico: MetricaMensual[]; // ordenado ascendente por mes
}

/** Utilidades derivadas. */
export function metricaActual(c: Cliente): MetricaMensual | undefined {
  return c.historico[c.historico.length - 1];
}

export function metricaAnterior(c: Cliente): MetricaMensual | undefined {
  return c.historico[c.historico.length - 2];
}

export function citasIA(m?: MetricaMensual): number {
  if (!m) return 0;
  return (m.citasChatGPT ?? 0) + (m.citasCopilot ?? 0) + (m.citasPerplexity ?? 0);
}

export function ingresoNFC(c: Cliente): number {
  return c.ventasNFC.reduce((acc, v) => acc + v.cantidad * v.precioUnitario, 0);
}
