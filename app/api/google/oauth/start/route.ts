import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { tieneSesionAdmin } from "@/lib/auth";
import { oauthConfigurado, urlDeAutorizacion } from "@/lib/google-oauth";

// Arranca la conexión de la cuenta de Google de la agencia (una sola vez).
// El state anti-CSRF viaja en una cookie httpOnly y se verifica en el
// callback — sin eso, un tercero podría hacerle "conectar" al admin una
// cuenta de Google ajena.
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await tieneSesionAdmin())) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!oauthConfigurado()) {
    return NextResponse.json(
      { error: "Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en Vercel." },
      { status: 503 },
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${req.nextUrl.origin}/api/google/oauth/callback`;
  const res = NextResponse.redirect(urlDeAutorizacion(redirectUri, state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
