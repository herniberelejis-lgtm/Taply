import Link from "next/link";
import { notFound } from "next/navigation";
import { getCliente, getChecklist } from "@/lib/db";
import { accionToggleChecklist } from "@/app/actions";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SeoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c, items] = await Promise.all([getCliente(id), getChecklist(id)]);
  if (!c) notFound();

  const hechos = items.filter((i) => i.hecho).length;
  const porcentaje = Math.round((hechos / items.length) * 100);

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link href={`/admin/clientes/${c.id}`} className="text-slate-500 hover:text-brand-fg">
          ← {c.nombre}
        </Link>
      </div>
      <PageHeader
        title="Checklist SEO local"
        subtitle={`${c.nombre} · ficha ${porcentaje}% optimizada`}
      />

      <Card>
        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {hechos} de {items.length} completados
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 py-3">
              <form action={accionToggleChecklist}>
                <input type="hidden" name="comercioId" value={c.id} />
                <input type="hidden" name="itemKey" value={item.key} />
                <input type="hidden" name="hecho" value={item.hecho ? "0" : "1"} />
                <button
                  type="submit"
                  aria-label={item.hecho ? "Marcar como pendiente" : "Marcar como hecho"}
                  className={
                    item.hecho
                      ? "grid h-6 w-6 place-items-center rounded-md bg-emerald-500 text-white"
                      : "grid h-6 w-6 place-items-center rounded-md border-2 border-slate-300"
                  }
                >
                  {item.hecho && "✓"}
                </button>
              </form>
              <span className={item.hecho ? "text-sm text-slate-400 line-through" : "text-sm text-slate-700"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
