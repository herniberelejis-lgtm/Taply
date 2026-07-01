import type { Cliente, MetricaMensual } from "./types";
import { citasIA } from "./types";

// Genera una recomendación concreta para el mes siguiente en base a la
// evolución del cliente. Es determinística (misma entrada → misma salida)
// y refleja las palancas del proyecto (reseñas, GBP, GEO/IA, schema).

export function recomendacionDelMes(
  c: Cliente,
  actual?: MetricaMensual,
  previa?: MetricaMensual,
): string {
  if (!actual) return "Configurar Google Business Profile y comenzar a medir el baseline.";

  const resenasBajaron =
    previa !== undefined && actual.resenasNuevas < previa.resenasNuevas;
  const fueraLocalPack = actual.posicionMaps > 3;
  const ratingBajo = actual.ratingPromedio < 4.5;
  const sinIA = c.plan === "Premium" && citasIA(actual) === 0;

  if (fueraLocalPack) {
    return `Todavía estás fuera del Local Pack (posición #${actual.posicionMaps}) para “${c.busquedaClave}”. Foco del mes: sumar reseñas recientes con la tarjeta NFC en cada atención y completar categorías/fotos del perfil de Google.`;
  }
  if (ratingBajo) {
    return `El rating promedio (${actual.ratingPromedio.toFixed(1)}) está por debajo de 4.5. Aplicar el protocolo de respuesta a reseñas negativas y pedir reseñas a los clientes más satisfechos con la tarjeta NFC.`;
  }
  if (resenasBajaron) {
    return "Cayó el ritmo de reseñas nuevas respecto al mes anterior. Reforzar el uso de la tarjeta NFC con el personal y sumar el sticker en mesas/mostrador para no perder el momento de intención.";
  }
  if (sinIA) {
    return "Aún sin citaciones en IA. Publicar 2 piezas de contenido IA-first respondiendo preguntas concretas del rubro y activar FAQPage schema + IndexNow para acelerar la indexación en Bing/Copilot.";
  }
  if (c.plan === "Base") {
    return "Buen mes: ya estás en el Local Pack. Es momento de proponer el upgrade a Premium (Dominancia en IA) para empezar a aparecer en ChatGPT y Copilot antes que la competencia.";
  }
  return "Mes sólido en Maps y en IA. Sostener el ritmo de reseñas y sumar una tercera pieza de contenido IA-first para ampliar el share of voice en las búsquedas del rubro.";
}
