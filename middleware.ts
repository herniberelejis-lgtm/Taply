import { NextResponse, type NextRequest } from "next/server";

// Protege el panel interno (/admin) con dos formas de sesión válidas:
// contraseña compartida (ADMIN_PASSWORD) o login con Google (allowlist de
// `admins`, ver /api/admin/oauth/callback). Todo lo demás es público: la
// landing (/), el portal de clientes (/portal/…), la página de tap (/t/…)
// y /login.
// Sin ADMIN_PASSWORD configurada: /admin abierto en desarrollo (tu PC),
// bloqueado en producción (nunca se publica el panel sin contraseña).
//
// Los dos formatos de cookie llevan un vencimiento firmado (ver lib/auth.ts)
// que se verifica acá con WebCrypto (esto corre en Edge, sin node:crypto).
// Además de este filtro por ruta, cada server action de admin vuelve a
// verificar la sesión por su cuenta (lib/auth.ts → requireAdmin), así una
// mutación nunca puede ejecutarse por un request forjado.

const PROTEGIDAS = /^\/admin(\/|$)/;

function base64UrlABytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacBase64Url(clave: string, mensaje: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(mensaje));
  return bytesToBase64Url(new Uint8Array(sig));
}

/** Comparación en tiempo constante (equivalente Edge de timingSafeEqual). */
function igualesConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cookie de contraseña compartida: "exp.firma" — mismo formato que arma
 * lib/auth.ts → crearCookiePassword. */
async function sesionPasswordValida(cookieValue: string, password: string): Promise<boolean> {
  const [exp, firma] = cookieValue.split(".");
  if (!exp || !firma) return false;
  if (!/^\d+$/.test(exp) || Date.now() > Number(exp)) return false;
  const esperada = await hmacBase64Url(password, `pw.${exp}`);
  return igualesConstante(esperada, firma);
}

/** Cookie de Google: "payload.firma" con el vencimiento dentro del payload. */
async function sesionGoogleValida(cookieValue: string): Promise<boolean> {
  const clave = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clave) return false;
  const [payload, firma] = cookieValue.split(".");
  if (!payload || !firma) return false;
  const esperada = await hmacBase64Url(clave, payload);
  if (!igualesConstante(esperada, firma)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlABytes(payload))) as {
      email?: string;
      exp?: number;
    };
    if (!data.email) return false;
    if (!data.exp || Date.now() > data.exp) return false; // sesión vencida
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTEGIDAS.test(pathname)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    // producción sin contraseña: mandar a /login, que explica cómo configurarla
  } else {
    const cookiePassword = req.cookies.get("admin_session")?.value;
    if (cookiePassword && (await sesionPasswordValida(cookiePassword, password))) {
      return NextResponse.next();
    }
  }

  const cookieGoogle = req.cookies.get("admin_google_session")?.value;
  if (cookieGoogle && (await sesionGoogleValida(cookieGoogle))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Solo /admin/* pasa por acá: correr el middleware en la landing, el portal
// y sobre todo en /t/[slug] (la ruta más caliente, cada tap de un cliente
// final) era latencia y facturación Edge sin ningún efecto.
export const config = {
  matcher: ["/admin/:path*"],
};
