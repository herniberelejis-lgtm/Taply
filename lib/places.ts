import "server-only";

// Cliente mínimo de Google Places API (New) — solo pide rating y cantidad
// de reseñas, el único dato que se puede automatizar sin que el dueño del
// negocio autorice nada (a diferencia de "visitas al perfil" o "llamadas",
// que viven en la Business Profile Performance API y sí requieren OAuth
// del dueño). Necesita GOOGLE_PLACES_API_KEY configurada — si falta, la
// sincronización se salta en silencio en vez de romper el resto del panel.

export interface GooglePlaceStats {
  rating: number;
  totalReseñas: number;
}

export async function fetchGooglePlaceStats(
  placeId: string,
): Promise<GooglePlaceStats | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !placeId) return null;

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount",
    },
    // Nunca cachear: siempre queremos el dato más nuevo cuando se pide.
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Places API respondió ${res.status} para place_id ${placeId}`);
    return null;
  }

  const data = (await res.json()) as { rating?: number; userRatingCount?: number };
  if (typeof data.rating !== "number") return null;

  return {
    rating: data.rating,
    totalReseñas: data.userRatingCount ?? 0,
  };
}
