import Link from "next/link";
import { getClientes } from "@/lib/db";
import { metricaActual, citasIA, ingresoNFC } from "@/lib/types";
import { fmtARS } from "@/lib/format";
import { accionEliminarCliente } from "@/app/actions";
import {
  Card,
  PageHeader,
  PlanBadge,
  EstadoBadge,
  Stars,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await getClientes();
  const ordenados = [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} cuentas en cartera`}
        actions={
          <Link
            href="/admin/clientes/nuevo"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Nuevo cliente
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenados.map((c) => {
          const m = metricaActual(c);
          return (
            <Card key={c.id} className="h-full transition-shadow hover:shadow-md">
              <Link href={`/admin/clientes/${c.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{c.nombre}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {c.rubro} · {c.zona}
                    </div>
                  </div>
                  <PlanBadge plan={c.plan} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {m ? <Stars rating={m.ratingPromedio} /> : <span className="text-xs text-slate-400">sin datos</span>}
                  <EstadoBadge estado={c.estado} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div>
                    <dt className="text-[11px] uppercase text-slate-400">Reseñas</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {m?.resenasTotal ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase text-slate-400">Visitas</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {m?.visitasPerfil ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase text-slate-400">IA</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {c.plan === "Premium" ? citasIA(m) : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Abono {fmtARS(c.fee)}</span>
                  <span>NFC {fmtARS(ingresoNFC(c))}</span>
                </div>
              </Link>

              <details className="mt-3 border-t border-slate-100 pt-2">
                <summary className="cursor-pointer text-xs text-rose-500 hover:text-rose-700">
                  Eliminar cliente
                </summary>
                <form action={accionEliminarCliente} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={c.id} />
                  <p className="text-[11px] text-slate-500">
                    Escribí <b>{c.nombre}</b> para confirmar. Borra todo (reseñas,
                    métricas, links, portal) y no se puede deshacer.
                  </p>
                  <input
                    name="confirmarNombre"
                    placeholder={c.nombre}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    Borrar definitivamente
                  </button>
                </form>
              </details>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
