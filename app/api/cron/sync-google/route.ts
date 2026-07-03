import { NextResponse, type NextRequest } from "next/server";
import { sincronizarGoogleTodos } from "@/lib/db";

// Job diario (ver vercel.json) que actualiza rating/reseñas de todos los
// comercios con Google Place ID cargado. Vercel Cron llama esta ruta con
// un header Authorization: Bearer <CRON_SECRET> — lo verificamos para que
// nadie más pueda disparar el sync desde afuera.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const resultado = await sincronizarGoogleTodos();
  return NextResponse.json(resultado);
}
