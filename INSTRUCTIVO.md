# Instructivo de Taply — de cero a vender

Guía práctica en español, sin tecnicismos. Si seguís estos pasos en orden,
tenés la plataforma online y lista para presentar a un comercio.

---

## Parte 1 · Poner la plataforma online (una sola vez, ~15 minutos)

Necesitás 3 cuentas gratuitas: **GitHub** (ya la tenés), **Neon** (la base de
datos) y **Vercel** (el sitio). Ninguna pide tarjeta.

### 1.1 · Crear la base de datos en Neon

1. Entrá a **[neon.tech](https://neon.tech)** y registrate (con tu cuenta de
   Google o GitHub es más rápido).
2. Tocá **Create project**. Nombre: `taply`. Región: la más cercana (por
   ejemplo *AWS us-east*). Create.
3. Neon te muestra un **connection string**. Copialo entero — empieza con
   `postgresql://` y termina en `?sslmode=require`. Guardalo, lo vas a usar
   dos veces.

### 1.2 · Cargar las tablas en Neon

En la misma pantalla de Neon, arriba, hay una pestaña **SQL Editor**.

1. Abrí el SQL Editor.
2. Abrí en tu compu el archivo `db/schema.sql` de este proyecto (o en GitHub:
   entrá al repo → carpeta `db` → `schema.sql` → botón **Raw** → copiá todo).
3. Pegalo en el SQL Editor de Neon y tocá **Run**. Debería decir *Success*.
4. Repetí lo mismo con `db/seed.sql` (los 7 comercios de ejemplo). Run.

> Con esto la base ya tiene la estructura y datos de demostración. Los datos
> de ejemplo los podés borrar después desde el panel.

### 1.3 · Subir el sitio a Vercel

1. Entrá a **[vercel.com/new](https://vercel.com/new)** y logueate con GitHub.
2. En la lista de repos, elegí **GEO-SEO-ANALYTICS** → **Import**.
3. **Antes de tocar Deploy**, abrí la sección **Environment Variables** y
   cargá estas tres:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | el connection string de Neon del paso 1.1 |
   | `ADMIN_PASSWORD` | una contraseña tuya para entrar al panel (inventala) |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | tu WhatsApp con código de país sin +, ej: `5493511234567` |

4. Tocá **Deploy**. En ~1 minuto te da una dirección tipo
   `https://geo-seo-analytics.vercel.app`. Esa es tu plataforma.

> **Importante — desactivá la protección de Vercel:** en el proyecto →
> Settings → **Deployment Protection** → poné *Vercel Authentication* en
> **Disabled**. Si no, tus clientes no van a poder abrir su portal.

Listo. Cada vez que se actualice el código, Vercel redeploya solo.

---

## Parte 2 · Cómo entra un comercio nuevo

### 2.1 · Darlo de alta

1. Andá a `tudireccion.vercel.app/admin` y poné tu `ADMIN_PASSWORD`.
2. **Clientes → + Nuevo cliente**. Completá:
   - Nombre, rubro, zona, plan (Base o Premium), contacto (WhatsApp).
   - **Link de reseñas de Google**: es el link directo a "escribir reseña"
     de la ficha del comercio (ver 2.2 para conseguirlo).
   - Búsqueda clave: cómo lo buscaría un cliente, ej. *"barbería en Güemes"*.
   - Abono mensual y tono de marca.
3. Crear. Se genera solo: la ficha, el **código del portal** y un primer
   link NFC de "Mostrador".

### 2.2 · Conseguir el link de reseñas de Google

1. Buscá el negocio en Google Maps.
2. En su ficha, botón **Compartir** → o buscá "Pedir reseñas" desde el
   perfil de empresa del dueño.
3. El link tiene esta forma: `https://g.page/r/...../review` o
   `https://search.google.com/local/writereview?placeid=...`.
4. Pegalo en el campo "Link de reseñas" del cliente.

### 2.3 · Programar el cartel NFC

1. En la compu, andá a la ficha del cliente → **Links NFC**. Ahí ves la
   dirección del link, tipo `tudireccion.vercel.app/t/mostrador`.
2. En el celular, bajá la app gratis **NFC Tools** (Android o iPhone).
3. En NFC Tools: **Escribir → Añadir un registro → URL/URI** → pegá esa
   dirección → **Escribir** → apoyá la tarjeta NFC en la parte de atrás del
   celular. Pitido = listo.
4. Probá con otro celular: al apoyarlo, se abre la pantalla de estrellas.

> Si el comercio quiere carteles distintos por mesa o sector, creá un link
> nuevo por cada uno (cada uno cuenta sus propios taps).

---

## Parte 3 · El trabajo mensual (lo que cobrás)

### Cada vez que puedas
- **Cargar reseñas nuevas**: ficha → **CRM de reseñas** → "Cargar reseña".
  El botón de respuesta sugerida te arma un texto listo — revisalo y pegalo
  en Google.
- **Feedback privado**: cuando alguien califica 1-3★ en el cartel, aparece
  solo en el CRM. Tocá **Avisar al dueño por WhatsApp** para que lo resuelva
  antes de que se haga público.

### Una vez por semana
- **Competencia**: ficha → **Competencia** → actualizá rating y reseñas de
  3-5 competidores (mirando Google Maps 2 minutos).

### Una vez por mes
- **Cargar métricas**: ficha → **+ Cargar métricas** (reseñas, posición en
  Maps, visitas; si es Premium, citaciones en IA).
- **Audit GEO**: ficha → **Audit GEO** → copiá una pregunta, pegala en
  ChatGPT o Claude (gratis), anotá si menciona al comercio. Es tu mejor
  argumento de venta: "hoy la IA no te nombra, en 2 meses sí".
- **Checklist SEO**: ficha → **Checklist SEO** → marcá lo que fuiste
  completando de la ficha de Google.

### El reporte
- Ficha → **Ver reporte mensual** → botón **Imprimir / Guardar como PDF** del
  navegador → se lo mandás al cliente por WhatsApp.

---

## Parte 4 · Venderle el portal al cliente

En la ficha de cada comercio hay un recuadro **Portal del cliente** con:
- Un **código de acceso** y un link `tudireccion.vercel.app/portal/<codigo>`.

Ese link se lo mandás al dueño por WhatsApp. Al abrirlo ve **solo su negocio**:
reseñas, posición en Maps, cuántas veces tocaron su cartel, quejas resueltas,
avance del SEO y (si es Premium) sus menciones en IA. No ve datos de otros ni
puede tocar nada.

Si el cliente deja de pagar: ficha → **Regenerar código**. El link viejo deja
de funcionar al instante.

---

## Parte 5 · La landing para vender

Tu dirección raíz (`tudireccion.vercel.app`) es una página de venta lista:
explica el producto, los planes y tiene un formulario que abre tu WhatsApp con
el mensaje precargado. Usala como tu folleto digital: mandá el link, o
mostrala en el celular cuando visitás un comercio.

---

## Seguridad — qué está cubierto

Se hizo una auditoría antes de entregar. Está resuelto:
- **El panel `/admin` está protegido por contraseña.** Sin la clave, no se
  entra, y además cada acción de guardado vuelve a verificar la sesión (no se
  puede forzar por afuera).
- **Los datos de cada cliente están aislados**: el portal muestra solo el
  comercio de ese código.
- **Los carteles públicos tienen freno anti-spam** (límite de envíos por
  visitante).
- **Headers de seguridad** activos (anti-clickjacking, HTTPS forzado, etc.).
- **No hay contraseñas ni secretos en el código** — todo va por variables de
  entorno en Vercel.

Recordá: elegí una `ADMIN_PASSWORD` que no sea obvia, y no compartas los links
de portal de un cliente con otro.

---

## Si algo no funciona

- **El portal de un cliente da 404**: el código se regeneró o está mal
  copiado. Copialo de nuevo desde la ficha.
- **El cartel no abre nada**: reprogramá el NFC (Parte 2.3); asegurate de que
  la dirección sea la de tu sitio en Vercel, no `localhost`.
- **No puedo entrar al panel**: revisá que `ADMIN_PASSWORD` esté cargada en
  Vercel (Settings → Environment Variables) y que hayas hecho *Redeploy*
  después de agregarla.
- **Los clientes no ven su portal**: desactivá *Deployment Protection* en
  Vercel (Parte 1.3).
