import { NextResponse, type NextRequest } from "next/server";
import { canjearCodigo } from "@/lib/google-oauth";
import { getClientePorCodigo, guardarTokenGoogleComercio } from "@/lib/db";

// Callback del OAuth de Google Business Profile por CLIENTE: canjea el code
// por un refresh token y lo guarda en el comercio que inició el flujo (leído
// del state, verificado contra la cookie httpOnly que puso /start).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const cookieState = req.cookies.get("portal_oauth_state")?.value ?? "";
  const [codigo] = state.split(".");

  const limpiar = (res: NextResponse) => {
    res.cookies.delete("portal_oauth_state");
    return res;
  };

  if (!state || state !== cookieState || !codigo) {
    return limpiar(NextResponse.redirect(new URL("/", req.url)));
  }

  const cliente = await getClientePorCodigo(codigo);
  if (!cliente) return limpiar(NextResponse.redirect(new URL("/", req.url)));

  const volver = (resultado: string) =>
    limpiar(NextResponse.redirect(new URL(`/portal/${codigo}?google=${resultado}`, req.url)));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return volver("cancelado");

  const redirectUri = `${req.nextUrl.origin}/api/portal/google/oauth/callback`;
  const { refreshToken } = await canjearCodigo(code, redirectUri);
  if (!refreshToken) return volver("error");

  await guardarTokenGoogleComercio(cliente.id, refreshToken);
  return volver("conectado");
}
