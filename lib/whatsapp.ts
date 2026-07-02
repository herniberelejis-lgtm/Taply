/** Genera un link wa.me — sin API de WhatsApp, gratis, siempre funciona. */
export function waUrl(numero: string, mensaje: string): string {
  const soloDigitos = numero.replace(/\D/g, "");
  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
}
