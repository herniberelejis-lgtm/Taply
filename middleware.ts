import { NextResponse, type NextRequest } from "next/server";

// Protege el panel interno (/admin) con dos formas de sesión válidas:
// contraseña compartida (ADMIN_PASSWORD) o login con Google (allowlist de
// `admins`, ver /api/admin/oauth/callback). Todo lo demás es público: la
// landing (/), el portal de clientes (/portal/…), la página de tap (/t/…)
// y /login.
// Sin ADMIN_PASSWORD configurada: /admin abierto en desarrollo (tu PC),
// bloqueado en producción (nunca se publica el panel sin contraseña).
//
// Además de este filtro por ruta, cada server action de admin vuelve a
// verificar la sesión por su cuenta (lib/auth.ts → requireAdmin), así una
// mutación nunca puede ejecutarse por un request forjado.

const PROTEGIDAS = /^\/admin(\/|$)/;

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

async function firmaValidaGoogle(payload: string, firma: string, clave: string): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  const esperada = bytesToBase64Url(new Uint8Array(sig));
  if (esperada.length !== firma.length) return false;
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
  return diff === 0;
}

async function sesionGoogleValida(cookieValue: string): Promise<boolean> {
  const clave = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clave) return false;
  const [payload, firma] = cookieValue.split(".");
  if (!payload || !firma) return false;
  if (!(await firmaValidaGoogle(payload, firma, clave))) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlABytes(payload))) as { email?: string };
    return Boolean(data.email);
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
    if (cookiePassword === (await sha256(password))) return NextResponse.next();
  }

  const cookieGoogle = req.cookies.get("admin_google_session")?.value;
  if (cookieGoogle && (await sesionGoogleValida(cookieGoogle))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
