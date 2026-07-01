# GEO · SEO Analytics — Panel de clientes

Dashboard interno para la agencia de presencia digital (NFC + GEO) de Córdoba.
Da forma al seguimiento de clientes descripto en el documento de proyecto:
reseñas de Google, posición en el Local Pack de Maps, citaciones en motores de
IA (GEO) y generación de reportes mensuales.

> Estado: **v0.1 — fundación con datos de ejemplo.** La UI y el modelo de
> dominio están completos; falta conectar las integraciones reales.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3** para estilos
- Sin base de datos todavía: los datos viven en `lib/data.ts` (mock)

## Correr en local

```bash
npm install
npm run dev      # http://localhost:3000
```

Otros scripts: `npm run build`, `npm run start`, `npm run lint`.

## Estructura

```
app/
  page.tsx                 Panel general (KPIs de cartera + tabla)
  clientes/page.tsx        Grilla de clientes
  clientes/[id]/page.tsx   Ficha del cliente + evolución + detalle mensual
  reportes/page.tsx        Índice de reportes
  reportes/[id]/page.tsx   Reporte mensual imprimible (formato del proyecto)
components/
  Sidebar.tsx              Navegación
  ui.tsx                   Card, Kpi, Sparkline, badges, Stars
lib/
  types.ts                 Modelo de dominio (Cliente, MetricaMensual, VentaNFC…)
  data.ts                  Datos de ejemplo
  format.ts                Formato es-AR (ARS, números, meses, deltas)
  recomendacion.ts         Genera la recomendación del reporte mensual
```

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
