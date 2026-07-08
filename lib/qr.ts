import "server-only";
import QRCode from "qrcode";

/** Genera el PNG de un QR real que codifica la URL dada — se usa para el
 * link NFC de cada cliente (/t/<slug>), listo para imprimir en el standee
 * físico o compartir por WhatsApp. */
export async function generarQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#10131a", light: "#ffffff" },
  });
}

/** La URL que se imprime dentro del QR de una pieza: SIEMPRE el dominio
 * canónico de producción (NEXT_PUBLIC_BASE_URL), no el host desde el que se
 * descargó el PNG. Sin esto, bajar un QR desde una preview de Vercel
 * imprime un QR apuntando a la preview (que muere al cerrarse la rama) y el
 * mismo código genera imágenes distintas según el entorno — rompería la
 * garantía de "el QR impreso no cambia nunca". El fallback al origin del
 * request queda solo para desarrollo local sin la variable configurada. */
export function urlPublicaDeTap(slug: string, fallbackOrigin: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || fallbackOrigin).replace(/\/+$/, "");
  return `${base}/t/${slug}`;
}
