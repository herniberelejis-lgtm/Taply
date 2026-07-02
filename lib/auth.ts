import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Autenticación del panel de admin. La cookie guarda el SHA-256 de la
// contraseña; validar = recomputar el hash y comparar en tiempo constante.

const COOKIE = "admin_session";

export function hashPassword(texto: string): string {
  return crypto.createHash("sha256").update(texto).digest("hex");
}

/** Comparación en tiempo constante para no filtrar info por timing. */
function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function tieneSesionAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  // Sin contraseña configurada: abierto solo en desarrollo (tu PC).
  if (!password) return process.env.NODE_ENV !== "production";
  const jar = await cookies();
  const cookie = jar.get(COOKIE)?.value;
  if (!cookie) return false;
  return iguales(cookie, hashPassword(password));
}

/**
 * Guard de las server actions de admin (defensa en profundidad). El
 * middleware ya bloquea las rutas /admin/*, pero las server actions son
 * endpoints POST y deben verificar la sesión por sí mismas: así nunca
 * pueden ejecutarse desde una ruta pública ni por un request forjado.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await tieneSesionAdmin())) {
    throw new Error("No autorizado. Iniciá sesión en el panel.");
  }
}
