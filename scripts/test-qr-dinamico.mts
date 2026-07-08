// Test end-to-end de la garantía central del hardware QR: el PNG del QR de
// una pieza NO cambia jamás aunque el destino de redirección cambie N veces,
// y el destino queda siempre abierto a volver a modificarse.
//
// Ejecuta el código REAL del repo (lib/db, lib/qr) contra un Postgres local:
//
//   NODE_OPTIONS="--conditions=react-server" \
//   DATABASE_URL="postgres://postgres@127.0.0.1:5433/taply" \
//   NEXT_PUBLIC_BASE_URL="https://geo-seo-analytics.vercel.app" \
//   ADMIN_PASSWORD="test" \
//   npx tsx scripts/test-qr-dinamico.mts [--http http://127.0.0.1:3100]
//
// Con --http, además prueba contra un `next dev` corriendo: el endpoint
// autenticado /api/admin/qr (bytes servidos idénticos) y la página pública
// /t/<slug> (el redirect SÍ cambia — 307 temporal, nunca cacheable).
//
// Sale con código 0 solo si TODAS las verificaciones pasan.

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  generarLotePiezas,
  asignarPiezaACliente,
  actualizarLink,
  getLink,
  getClientes,
} from "../lib/db";
import { generarQrPng, urlPublicaDeTap } from "../lib/qr";
import { crearCookiePassword } from "../lib/sesion";
import { sql } from "../lib/sql";

const HTTP_BASE = (() => {
  const i = process.argv.indexOf("--http");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const EVIDENCIA = process.env.QR_TEST_DIR ?? "/tmp/taply-qr-test";
const URL_A = "https://ejemplo-a.com/promo-julio";
const URL_B = "https://ejemplo-b.com/menu-nuevo";

let fallos = 0;

function ok(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✅ ${msg}`);
  } else {
    fallos += 1;
    console.error(`  ❌ FALLÓ: ${msg}`);
  }
}

function sha256(buf: Buffer | Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function qrDePieza(slug: string): Promise<{ png: Buffer; hash: string }> {
  // Mismo camino que las rutas del panel: URL canónica + generador real.
  const png = await generarQrPng(urlPublicaDeTap(slug, "http://origen-que-no-deberia-usarse.invalid"));
  return { png, hash: sha256(png) };
}

async function fetchQrRuta(slug: string, cookie: string): Promise<string | null> {
  if (!HTTP_BASE) return null;
  const res = await fetch(`${HTTP_BASE}/api/admin/qr?linkId=${slug}`, {
    headers: { cookie: `admin_session=${cookie}` },
  });
  if (!res.ok) throw new Error(`/api/admin/qr ${slug} devolvió ${res.status}`);
  return sha256(new Uint8Array(await res.arrayBuffer()));
}

async function destinoPublico(slug: string): Promise<{ status: number; location: string | null }> {
  const res = await fetch(`${HTTP_BASE}/t/${slug}`, {
    redirect: "manual",
    // UA de persona real: el registro de taps filtra bots/curl, y además
    // un redirect manual no debe seguirse.
    headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) TestTaply" },
  });
  return { status: res.status, location: res.headers.get("location") };
}

async function main(): Promise<void> {
  await mkdir(EVIDENCIA, { recursive: true });

  const clientes = await getClientes();
  if (clientes.length === 0) throw new Error("El seed no cargó comercios.");
  const cliente = clientes[0];
  console.log(`Cliente de prueba: ${cliente.nombre} (${cliente.id})\n`);

  const cookie = await crearCookiePassword(process.env.ADMIN_PASSWORD ?? "");

  // ---- 1. Generar el lote de 5 piezas (flujo real de /admin/hardware) ----
  const piezas = await generarLotePiezas(5, "qr", "test-qr-dinamico");
  console.log(`Lote generado: ${piezas.map((p) => p.id).join(", ")}\n`);
  ok(piezas.length === 5, "se generaron 5 piezas");

  if (HTTP_BASE) {
    // Sin cookie el endpoint del QR debe rechazar (auth real, sin bypass).
    const sinAuth = await fetch(`${HTTP_BASE}/api/admin/qr?linkId=${piezas[0].id}`);
    ok(sinAuth.status === 401, "GET /api/admin/qr sin sesión devuelve 401");
  }

  for (const pieza of piezas) {
    const slug = pieza.id;
    console.log(`\n── Pieza ${slug} ──`);

    // ---- 2. QR baseline: pieza recién generada, todavía libre ----
    const base = await qrDePieza(slug);
    await writeFile(`${EVIDENCIA}/${slug}-1-libre.png`, base.png);

    // ---- 3. Asignar a un cliente con destino URL_A ----
    await asignarPiezaACliente(slug, cliente.id, {
      etiqueta: `test ${slug}`,
      destino: "url_custom",
      urlDestino: URL_A,
    });
    const trasAsignar = await qrDePieza(slug);
    await writeFile(`${EVIDENCIA}/${slug}-2-asignada.png`, trasAsignar.png);
    ok(trasAsignar.hash === base.hash, `QR idéntico tras asignar y apuntar a ${URL_A}`);
    if (HTTP_BASE) {
      const d = await destinoPublico(slug);
      ok(d.status === 307 && d.location === URL_A, `/t/${slug} redirige 307 → URL A`);
      const hashRuta = await fetchQrRuta(slug, cookie);
      ok(hashRuta === base.hash, "PNG servido por /api/admin/qr byte-idéntico al baseline");
    }

    // ---- 4. CAMBIO de destino (URL_A → URL_B): el QR no debe moverse ----
    await actualizarLink(slug, { destino: "url_custom", urlDestino: URL_B });
    const linkB = await getLink(slug);
    ok(linkB?.urlDestino === URL_B, "el destino guardado cambió a URL B");
    const trasCambio = await qrDePieza(slug);
    await writeFile(`${EVIDENCIA}/${slug}-3-destino-b.png`, trasCambio.png);
    ok(trasCambio.hash === base.hash, "QR byte-idéntico tras cambiar el destino");
    if (HTTP_BASE) {
      const d = await destinoPublico(slug);
      ok(d.status === 307 && d.location === URL_B, `/t/${slug} ahora redirige 307 → URL B`);
      const hashRuta = await fetchQrRuta(slug, cookie);
      ok(hashRuta === base.hash, "PNG servido sigue byte-idéntico tras el cambio");
    }

    // ---- 5. SEGUNDO cambio (URL_B → star-gate de reseñas): sigue abierto ----
    await actualizarLink(slug, { destino: "resena", urlDestino: null });
    const linkC = await getLink(slug);
    ok(linkC?.destino === "resena", "el destino se volvió a modificar (queda abierto)");
    const trasSegundo = await qrDePieza(slug);
    await writeFile(`${EVIDENCIA}/${slug}-4-resena.png`, trasSegundo.png);
    ok(trasSegundo.hash === base.hash, "QR byte-idéntico tras el segundo cambio");
    if (HTTP_BASE) {
      const d = await destinoPublico(slug);
      // destino=resena con filtro: la página del star-gate se sirve acá
      // mismo (200), ya no hay redirect.
      ok(d.status === 200, `/t/${slug} sirve el star-gate (200) con destino reseña`);
    }

    console.log(`  hash: ${base.hash.slice(0, 16)}… (idéntico en las 4 instancias)`);
  }

  // ---- 6. Limpieza: las piezas de prueba no quedan en el inventario ----
  await sql`DELETE FROM links_nfc WHERE lote = 'test-qr-dinamico'`;

  console.log(`\nEvidencia (PNGs de cada etapa): ${EVIDENCIA}`);
  if (fallos > 0) {
    console.error(`\n❌ ${fallos} verificación(es) fallaron`);
    process.exit(1);
  }
  console.log("\n✅ TODAS las verificaciones pasaron: 5 QRs inmutables con destino re-editable");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sql.end());
