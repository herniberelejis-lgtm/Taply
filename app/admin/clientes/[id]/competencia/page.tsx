import Link from "next/link";
import { notFound } from "next/navigation";
import { getCliente, getCompetidores } from "@/lib/db";
import {
  accionActualizarCompetidor,
  accionCrearCompetidor,
  accionEliminarCompetidor,
} from "@/app/actions";
import { Field, inputCls, SubmitButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CompetenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c, competidores] = await Promise.all([getCliente(id), getCompetidores(id)]);
  if (!c) notFound();

  const miUltimaMetrica = c.historico[c.historico.length - 1];
  const fila = [
    { nombre: `${c.nombre} (vos)`, rating: miUltimaMetrica?.ratingPromedio ?? null, total: miUltimaMetrica?.resenasTotal ?? null, soyYo: true },
    ...competidores.map((comp) => ({ nombre: comp.nombre, rating: comp.rating, total: comp.totalResenas, soyYo: false, id: comp.id })),
  ].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link href={`/admin/clientes/${c.id}`} className="text-slate-500 hover:text-brand-fg">
          ← {c.nombre}
        </Link>
      </div>
      <PageHeader
        title="Monitoreo de competencia"
        subtitle={`${c.nombre} · ranking de tu zona`}
      />

      {fila.length > 0 && (
        <Card className="mb-6 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Reseñas</th>
              </tr>
            </thead>
            <tbody>
              {fila.map((f, i) => (
                <tr
                  key={f.nombre}
                  className={`border-b border-slate-100 last:border-0 ${f.soyYo ? "bg-brand/5" : ""}`}
                >
                  <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{f.nombre}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {f.rating !== null ? `${Number(f.rating).toFixed(1)}★` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{f.total ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Agregar competidor
      </h2>
      <Card>
        <form action={accionCrearCompetidor} className="space-y-4">
          <input type="hidden" name="comercioId" value={c.id} />
          <Field label="Nombre del competidor">
            <input name="nombre" required placeholder="Bar Central" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating" hint="opcional, 1.0 a 5.0">
              <input name="rating" type="number" min={1} max={5} step={0.1} className={inputCls} />
            </Field>
            <Field label="Total de reseñas" hint="opcional">
              <input name="totalResenas" type="number" min={0} className={inputCls} />
            </Field>
          </div>
          <SubmitButton>Agregar</SubmitButton>
        </form>
      </Card>

      {competidores.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-900">
            Actualizar cada semana
          </h2>
          <div className="space-y-3">
            {competidores.map((comp) => (
              <Card key={comp.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{comp.nombre}</span>
                  <form action={accionEliminarCompetidor}>
                    <input type="hidden" name="id" value={comp.id} />
                    <input type="hidden" name="comercioId" value={c.id} />
                    <button type="submit" className="text-xs text-rose-500 hover:text-rose-700">
                      Eliminar
                    </button>
                  </form>
                </div>
                <form action={accionActualizarCompetidor} className="mt-3 flex items-end gap-3">
                  <input type="hidden" name="id" value={comp.id} />
                  <input type="hidden" name="comercioId" value={c.id} />
                  <Field label="Rating">
                    <input
                      name="rating"
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      defaultValue={comp.rating ?? undefined}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Total reseñas">
                    <input
                      name="totalResenas"
                      type="number"
                      min={0}
                      defaultValue={comp.totalResenas ?? undefined}
                      className={inputCls}
                    />
                  </Field>
                  <SubmitButton>Guardar</SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
