import { NextResponse, type NextRequest } from "next/server";
import { tieneSesionAdmin } from "@/lib/auth";
import { canjearCodigo } from "@/lib/google-oauth";
import { setAjuste } from "@/lib/db";

// Callback del OAuth de Google: canjea el code por un refresh token y lo
// guarda en `ajustes`. A partir de acá el cron diario puede pedir visitas
// y llamadas de todas las fichas que administre la cuenta conectada.
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await tieneSesionAdmin())) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const volver = (resultado: string) => {
    const res = NextResponse.redirect(
      new URL(`/admin/clientes?google=${resultado}`, req.url),
    );
    res.cookies.delete("g_oauth_state");
    return res;
  };

  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("g_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) {
    return volver("error-estado");
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return volver("cancelado");

  const redirectUri = `${req.nextUrl.origin}/api/google/oauth/callback`;
  const refreshToken = await canjearCodigo(code, redirectUri);
  if (!refreshToken) return volver("error");

  await setAjuste("google_refresh_token", refreshToken);
  return volver("conectado");
}
