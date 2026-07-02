import Link from "next/link";
import { notFound } from "next/navigation";
import { getCliente, getAudits } from "@/lib/db";
import { accionRegistrarAudit } from "@/app/actions";
import { Field, inputCls, SubmitButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

const PLATAFORMAS = ["ChatGPT", "Claude", "Perplexity", "Gemini", "Otra"] as const;

const CHATS_GRATUITOS = [
  { nombre: "ChatGPT", url: "https://chatgpt.com" },
  { nombre: "Claude.ai", url: "https://claude.ai" },
  { nombre: "Perplexity", url: "https://www.perplexity.ai" },
  { nombre: "Gemini", url: "https://gemini.google.com" },
];

function rubroGenerico(rubro: string): string {
  // primera palabra del rubro, en minúscula ("Peluquería / Barbería" -> "peluquería")
  return rubro.split(/[\s/]/)[0].toLowerCase();
}

export default async function GeoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c, audits] = await Promise.all([getCliente(id), getAudits(id)]);
  if (!c) notFound();

  const rubro = rubroGenerico(c.rubro);
  const preguntas = [
    `¿Cuál es el/la mejor ${rubro} en ${c.zona}, Córdoba?`,
    `Recomendame un/a ${rubro} cerca de ${c.zona}`,
    `¿Dónde encuentro ${c.busquedaClave}?`,
  ];

  const ultimaPorPregunta = new Map<string, (typeof audits)[number]>();
  for (const a of audits) {
    if (!ultimaPorPregunta.has(a.pregunta)) ultimaPorPregunta.set(a.pregunta, a);
  }
  const apariciones = audits.filter((a) => a.aparece).length;

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link href={`/admin/clientes/${c.id}`} className="text-slate-500 hover:text-brand-fg">
          ← {c.nombre}
        </Link>
      </div>
      <PageHeader
        title="Audit GEO"
        subtitle={`${c.nombre} · ¿la IA te recomienda? · ${apariciones} de ${audits.length || 0} consultas con aparición`}
      />

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">
          Paso 1 · Copiá una pregunta
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Preguntas armadas con el rubro y la zona del comercio. Copiá una,
          pegala en un chat gratuito y anotá si te menciona.
        </p>
        <ul className="mt-3 space-y-2">
          {preguntas.map((p) => (
            <li key={p} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-700">{p}</span>
              <CopyButton texto={p} />
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-slate-900">
          Paso 2 · Pegala en un chat gratuito
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHATS_GRATUITOS.map((chat) => (
            <a
              key={chat.nombre}
              href={chat.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              Abrir {chat.nombre} ↗
            </a>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-semibold text-slate-900">
          Paso 3 · Registrá el resultado
        </h2>
        <form action={accionRegistrarAudit} className="mt-3 space-y-4">
          <input type="hidden" name="comercioId" value={c.id} />
          <Field label="Pregunta que usaste">
            <input
              name="pregunta"
              required
              defaultValue={preguntas[0]}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plataforma">
              <select name="plataforma" defaultValue="ChatGPT" className={inputCls}>
                {PLATAFORMAS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="¿Te mencionó?">
              <select name="aparece" defaultValue="0" className={inputCls}>
                <option value="1">Sí, apareció</option>
                <option value="0">No, no apareció</option>
              </select>
            </Field>
          </div>
          <Field label="Competidores que mencionó" hint="opcional">
            <input
              name="competidoresMencionados"
              placeholder="Bar Central, La Esquina..."
              className={inputCls}
            />
          </Field>
          <SubmitButton>Guardar resultado</SubmitButton>
        </form>
      </Card>

      {audits.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-900">
            Historial
          </h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Pregunta</th>
                  <th className="px-4 py-3 font-medium">Plataforma</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Competidores</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-600">
                      {new Date(a.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">{a.pregunta}</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.plataforma}</td>
                    <td className="px-4 py-2.5">
                      {a.aparece ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          ✅ apareció
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                          ❌ no apareció
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {a.competidoresMencionados || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
