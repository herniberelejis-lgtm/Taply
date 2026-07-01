# GEO · SEO Analytics — Panel de clientes

Dashboard interno para la agencia de presencia digital (NFC + GEO) de Córdoba.
Da forma al seguimiento de clientes descripto en el documento de proyecto:
reseñas de Google, posición en el Local Pack de Maps, citaciones en motores de
IA (GEO) y generación de reportes mensuales.

> Estado: **v0.2 — producto operativo.** Alta/edición de clientes, carga
> mensual de métricas, ventas NFC, analytics y portal de clientes por código
> de acceso. Falta conectar las integraciones automáticas (GBP, Bing, OtterlyAI).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3** para estilos
- **Base de datos en el repo**: `data/db.json`, versionada en git. Cero
  servicios externos — cada `git push` respalda también los datos. Si el
  archivo no existe (clon nuevo), se crea solo a partir de `lib/seed.ts`.

## Correr en local

```bash
npm install
npm run dev      # http://localhost:3000
```

Otros scripts: `npm run build`, `npm run start`, `npm run lint`.

## Estructura

```
app/
  (admin)/                       Panel interno (con sidebar)
    page.tsx                     Panel general (KPIs de cartera + tabla)
    analytics/                   Analytics de cartera (filtros + 5 gráficos)
    clientes/                    Grilla, alta (/nuevo), ficha, edición,
                                 carga de métricas (/[id]/metricas)
    reportes/                    Reporte mensual imprimible por cliente
  portal/[codigo]/page.tsx       Portal del cliente (read-only, por código)
  actions.ts                     Server actions (mutaciones sobre la DB)
components/
  Sidebar.tsx                    Navegación del panel
  ui.tsx                         Card, Kpi, Sparkline, badges, Stars
  forms.tsx                      Formularios (cliente, métricas, venta NFC)
  AnalyticsView.tsx              Vista client-side de analytics
  charts/                        Primitivas SVG (columnas, barras, línea)
data/
  db.json                        LA BASE DE DATOS (versionada en git)
lib/
  db.ts                          Capa de acceso: CRUD sobre data/db.json
  types.ts                       Modelo de dominio
  seed.ts                        Datos semilla (solo primer arranque)
  format.ts / palette.ts / recomendacion.ts
```

## Flujo de trabajo diario

1. **Vendiste una tarjeta / cerraste un cliente** → Clientes → *+ Nuevo cliente*.
2. **Cargar el mes** → ficha del cliente → *+ Cargar métricas* (si el mes ya
   existe, se reemplaza).
3. **Venta de NFC adicional** → ficha → *Editar / Venta NFC*.
4. **Venderle el acceso** → la ficha muestra el **código de portal** y el link
   `/portal/<codigo>` para mandarle por WhatsApp. El cliente ve solo sus datos,
   su evolución y la recomendación del mes. *Regenerar código* corta el acceso
   anterior (por ejemplo si deja de pagar).
5. **Respaldar** → `git add data/db.json && git commit -m "datos" && git push`.

## Modelo de dominio

Cada **Cliente** tiene plan (Base/Premium), zona, rubro, abono, ventas de
producto NFC y un histórico de **MetricaMensual**: reseñas, rating, posición en
Maps, visitas/llamadas/“cómo llegar” y —solo Premium— citaciones en
ChatGPT/Copilot/Perplexity.

El **reporte mensual** respeta el formato del proyecto: 1–2 páginas, 3 métricas
clave y una recomendación concreta autogenerada (`lib/recomendacion.ts`). Se
exporta con “Imprimir / Guardar como PDF” del navegador.

## Próximos pasos sugeridos

1. **Persistencia**: reemplazar `lib/data.ts` por una base de datos.
2. **Integraciones**: Google Business Profile, Search Console, Bing Webmaster
   Tools (AI Performance) y OtterlyAI para poblar las métricas reales.
3. **Alta/edición de clientes** y carga manual de métricas mientras no haya API.
4. **Export de PDF** server-side para envío directo por WhatsApp.
5. **Autenticación** para el equipo de la agencia.
