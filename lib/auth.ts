import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Autenticación del panel de admin — dos formas, una sesión:
// 1. Contraseña compartida (histórica): cookie con SHA-256 de la contraseña.
// 2. Google, restringido a la allowlist de `admins`: cookie firmada (HMAC)
//    con el email de quien entró, para que auditoria.ts sepa quién hizo qué.
// La sesión por Google es la preferida — es la única que deja identidad.

const COOKIE = "admin_session";
export const COOKIE_GOOGLE = "admin_google_session";

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

// La cookie de Google se firma con el client secret de OAuth: ya es un
// secreto de servidor que existe si esta función va a usarse (sin OAuth
// configurado no hay login por Google posible), así evitamos pedir una
// variable de entorno nueva solo para esto.
function claveFirmaGoogle(): string | undefined {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET;
}

function firmarPayload(payload: string): string {
  return crypto.createHmac("sha256", claveFirmaGoogle() ?? "").update(payload).digest("base64url");
}

/** Arma el valor de la cookie de sesión por Google: payload.firma */
export function crearCookieSesionGoogle(email: string, nombre: string): string {
  const payload = Buffer.from(JSON.stringify({ email, nombre })).toString("base64url");
  return `${payload}.${firmarPayload(payload)}`;
}

function leerCookieSesionGoogle(valor: string): { email: string; nombre: string } | null {
  if (!claveFirmaGoogle()) return null;
  const [payload, firma] = valor.split(".");
  if (!payload || !firma) return null;
  if (!iguales(firma, firmarPayload(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      email?: string;
      nombre?: string;
    };
    if (!data.email) return null;
    return { email: data.email, nombre: data.nombre ?? "" };
  } catch {
    return null;
  }
}

export async function tieneSesionAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  // Sin contraseña configurada: abierto solo en desarrollo (tu PC).
  if (!password) return process.env.NODE_ENV !== "production";
  const jar = await cookies();

  const porPassword = jar.get(COOKIE)?.value;
  if (porPassword && iguales(porPassword, hashPassword(password))) return true;

  const porGoogle = jar.get(COOKIE_GOOGLE)?.value;
  if (porGoogle && leerCookieSesionGoogle(porGoogle)) return true;

  return false;
}

/** Email de quien está logueado, solo si entró con Google — para auditoria.
 * Con login por contraseña no hay forma de saber quién es (por eso el
 * objetivo es migrar el equipo al login con Google). */
export async function emailAdminActual(): Promise<string | null> {
  const jar = await cookies();
  const porGoogle = jar.get(COOKIE_GOOGLE)?.value;
  if (!porGoogle) return null;
  return leerCookieSesionGoogle(porGoogle)?.email ?? null;
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
