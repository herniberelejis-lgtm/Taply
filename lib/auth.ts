import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { esAdminPermitido } from "./db";

// Autenticación del panel de admin — dos formas, una sesión:
// 1. Contraseña compartida (histórica): cookie con un vencimiento firmado
//    por HMAC usando la contraseña como clave. La cookie NO contiene la
//    contraseña ni su hash: capturarla no permite deducirla ni fabricar
//    sesiones nuevas, y cambiar ADMIN_PASSWORD corta todas las sesiones.
// 2. Google, restringido a la allowlist de `admins`: cookie firmada (HMAC)
//    con el email de quien entró + vencimiento, para que auditoria.ts sepa
//    quién hizo qué. La sesión por Google es la preferida — deja identidad.
//
// Toda sesión vence server-side a los 30 días (el maxAge de la cookie es
// solo una indicación al navegador; lo que manda es el exp firmado).

const COOKIE = "admin_session";
export const COOKIE_GOOGLE = "admin_google_session";
export const SESION_MAX_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

/** Comparación en tiempo constante para no filtrar info por timing. */
function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------- Sesión por contraseña compartida ----------

function firmarPassword(exp: string): string {
  return crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD ?? "")
    .update(`pw.${exp}`)
    .digest("base64url");
}

/** Arma el valor de la cookie de sesión por contraseña: exp.firma */
export function crearCookiePassword(): string {
  const exp = String(Date.now() + SESION_MAX_MS);
  return `${exp}.${firmarPassword(exp)}`;
}

export function cookiePasswordValida(valor: string): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const [exp, firma] = valor.split(".");
  if (!exp || !firma) return false;
  if (!/^\d+$/.test(exp) || Date.now() > Number(exp)) return false;
  return iguales(firma, firmarPassword(exp));
}

// ---------- Sesión por Google ----------

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

/** Arma el valor de la cookie de sesión por Google: payload.firma — el
 * payload lleva el vencimiento adentro, verificado al leer. */
export function crearCookieSesionGoogle(email: string, nombre: string): string {
  const exp = Date.now() + SESION_MAX_MS;
  const payload = Buffer.from(JSON.stringify({ email, nombre, exp })).toString("base64url");
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
      exp?: number;
    };
    if (!data.email) return null;
    if (!data.exp || Date.now() > data.exp) return null; // sesión vencida
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
  if (porPassword && cookiePasswordValida(porPassword)) return true;

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
 *
 * Además, si la sesión es por Google, re-chequea la allowlist `admins` en
 * cada mutación: sacar a alguien de /admin/administradores le revoca el
 * acceso de verdad, aunque su cookie siga vigente.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await tieneSesionAdmin())) {
    throw new Error("No autorizado. Iniciá sesión en el panel.");
  }
  const email = await emailAdminActual();
  if (email && !(await esAdminPermitido(email))) {
    throw new Error("Tu acceso al panel fue revocado.");
  }
}
