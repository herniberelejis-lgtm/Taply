import "server-only";

// OAuth de Google para la Business Profile Performance API (visitas al
// perfil, llamadas, clics "cómo llegar"). A diferencia de Places API (que
// alcanza con una API key), estos datos son privados de cada ficha: Google
// exige que una cuenta con acceso de administrador a la ficha autorice
// con OAuth. El flujo acá es de UNA sola autorización para toda la
// agencia: la cuenta de Google del admin (que debe ser administradora de
// las fichas de sus clientes) autoriza una vez, guardamos el refresh
// token en la tabla `ajustes`, y el cron lo usa a diario.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";

export function oauthConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
}

export function urlDeAutorizacion(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GBP_SCOPE,
    access_type: "offline", // pide refresh token (para el cron, sin humano)
    prompt: "consent", // fuerza a Google a devolver refresh token siempre
    state,
  });
  return `${AUTH_URL}?${params}`;
}

/** Canjea el code del callback por un refresh token. */
export async function canjearCodigo(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`OAuth: canje de código respondió ${res.status}`);
    return null;
  }
  const data = (await res.json()) as { refresh_token?: string };
  return data.refresh_token ?? null;
}

/** Access token de corta vida a partir del refresh token guardado. */
export async function accessTokenDesdeRefresh(
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`OAuth: refresh respondió ${res.status} — puede que haya que reconectar Google`);
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}
