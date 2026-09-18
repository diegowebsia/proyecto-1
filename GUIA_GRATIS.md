# 🆓 GUIA_GRATIS — ReviewFlow AI a 0 € (v3.13.0)

Dos cosas en un solo documento:

1. **La explicación comercial de los 4 planes de pago** (para que la entiendas tú y se la
   cuentes a un cliente en 30 segundos).
2. **Cómo montar y probar el proyecto completo sin pagar nada** (~30 minutos).

> ⚠️ El plan Hobby de Vercel **prohíbe el uso comercial** (usa Stripe en modo test,
> sin dinero real). Cuando vayas a vender, pasa a [GUIA_DESPLIEGUE.md](./GUIA_DESPLIEGUE.md).

---

## 1. Los planes, en lenguaje de cliente 💬

| | 🔵 **Negocio** | 🔵 **Negocio Plus** | 🟣 **Tiendas** | 🟣 **Tiendas Plus** |
|---|---|---|---|---|
| **Precio** | 19 €/mes | 39 €/mes | 49 €/mes | 89 €/mes |
| **Ideal para** | Bar, clínica, pelu… con opiniones cada semana | Varios locales o mucho volumen sin tienda | Tienda online / dropshipping | Ecommerce multi-marca o con muchos pedidos |
| **Pide opiniones** | 400 al mes por email **y WhatsApp** | 1.200 al mes | 2.000 al mes | 6.000 al mes |
| **Guarda e importa** | 800 al mes (máx. 3.000 en total) | 2.500/mes (máx. 10.000) | 5.000/mes (máx. 25.000) | 15.000/mes (máx. 100.000) |
| **Respuestas con IA** | 200 al mes | 700 al mes | 1.500 al mes | 4.000 al mes |
| **Presupuesto de IA incluido** | 150.000 tokens/mes | 600.000 tokens/mes | 1.200.000 tokens/mes | 3.000.000 tokens/mes |
| **Sincronizaciones automáticas** | cada 6 h | cada 3 h | cada hora | cada 30 min |
| **Sedes** | 1 | 5 | 10 | 30 |
| **Emails de solicitud** | ✅ | ✅ | ✅ | ✅ |
| **Google (reseñas + publicar respuestas)** | ✅ | ✅ | ✅ | ✅ |
| **Alertas y peticiones por WhatsApp** | ✅ | ✅ | ✅ | ✅ |
| **Trustpilot** | ✅ | ✅ | ✅ | ✅ |
| **TripAdvisor** | ✅ | ✅ | ✅ | ✅ |
| **Embudo privado `/valorar` (plataformas para todos + ticket privado opcional)** | ✅ | ✅ | ✅ | ✅ |
| **Tienda (Shopify / Woo / TPV) + WhatsApp al entregar** | ❌ | ❌ | ✅ | ✅ |
| **Soporte** | Comunidad | Email | Email | Prioritario |
| **Prueba** | 7 días gratis con tarjeta | 7 días gratis con tarjeta | 7 días gratis con tarjeta | 7 días gratis con tarjeta |

**Cómo contarlo en una frase:**
> «Prueba 7 días gratis, sin pagar nada. Para un bar, una clínica o una peluquería están
> Negocio (19 €) y Negocio Plus (39 €, con más sedes y cuotas). Y si vendes online, los
> planes Tiendas (49 € y 89 €) además avisan solos por WhatsApp al entregar cada pedido
> y te piden la reseña en el momento perfecto.»

**Preguntas que te harán (y respuestas cortas):**

- *«¿Qué es una petición?»* → Cada email o WhatsApp que pides a un cliente. Según plan: 400 (Negocio), 1.200 (Negocio Plus), 2.000 (Tiendas) o 6.000 (Tiendas Plus) al mes.
- *«¿Qué pasa si me quedo sin cuota antes de fin de mes?»* → Nada se rompe: sigues viendo tus opiniones, pero no se envían nuevas. Puedes esperar al día 1 o comprar una recarga puntual (+1.000 peticiones 9 €).
- *«¿Pierdo mis opiniones si no pago?»* → No. Tu historial se conserva 30 días; al reactivar tu plan recuperas el acceso tal cual.
- *«¿Puedo cambiar de plan?»* → Sí, desde el botón *Suscripción* (portal de Stripe), cuando quieras y sin llamadas.
- *«¿Guarda todos mis datos?»* → Cada plan tiene un tope de almacenamiento (2 GB / 10 GB) y las opiniones más antiguas se archivan al llenarse. Así el precio nunca sube «por sorpresa» por exceso de datos.
- *«¿Cómo funciona la IA?»* → Escribe un borrador de respuesta en el tono de tu negocio (y avisa en privado cuando la reseña es de 1–3★). Usa `gpt-4o-mini`, el modelo más económico de OpenAI: cada respuesta cuesta céntimas de céntimo y va incluida en tu plan.
- *«¿Y si la IA se pasa de lista con el gasto?»* → No puede: tu plan incluye un presupuesto de tokens (250.000 / 1.200.000). Al agotarlo, la IA se pausa hasta el día 1 y sigues respondiendo con plantillas; nunca hay cargos sorpresa.
- *«¿Qué pasa si OpenAI se cae?»* → La plataforma reintenta sola y, si no responde, usa una plantilla profesional local. Nunca te quedas sin poder responder.

---

## 2. Stack gratuito para probarlo (coste total: 0 €)

| Servicio | Web | Plan gratis | Límite a conocer |
|---|---|---|---|
| Código + despliegue | [vercel.com](https://vercel.com) | Hobby | Solo uso **no comercial**; 100 GB/mes |
| Base de datos + auth | [supabase.com](https://supabase.com) | Free | 500 MB; se **pausa tras 1 semana sin uso** (1 clic para reactivar) |
| Pagos (pruebas) | [stripe.com](https://stripe.com) | Modo test | Tarjeta ficticia `4242 4242 4242 4242`; prueba de 7 días sin cargo |
| Emails | [brevo.com](https://www.brevo.com) | Free | 300 emails/día |
| IA | [platform.openai.com](https://platform.openai.com) | Créditos iniciales | `gpt-4o-mini` cuesta ~0,0001 $ por respuesta; el presupuesto del plan ya acota el gasto. Sin clave: plantilla local |
| Postgres directo (opcional) | Supabase | Pooler incluido | `DATABASE_URL` del puerto 6543 para diagnóstico y purga |

## Paso 1 — Sube el código a GitHub (3 min)

1. [github.com](https://github.com) → crea un repositorio (o usa este).
2. Sube el proyecto (web, GitHub Desktop o `git push`).

## Paso 2 — Base de datos en Supabase (5 min)

1. [supabase.com](https://supabase.com) → **New project** (plan Free).
2. **Project Settings → API** → copia: `Project URL`, `anon public`, `service_role`.
3. **SQL Editor → New query** → pega **todo** `supabase/schema.sql` → **Run** (`Success`).
   - ¿Ya tenías la BD de una versión anterior? Ejecuta en orden las migraciones
     `migration_3_2_0.sql` → `migration_3_3_0.sql` → `migration_3_4_0.sql` →
     `migration_3_5_0.sql` → `migration_3_6_0.sql` → `migration_3_7_0.sql` →
     `migration_3_8_0.sql` → `migration_3_9_0.sql` → `migration_3_10_0.sql` → `migration_3_11_0.sql` → `migration_3_12_0.sql` → **`migration_3_13_0.sql`**
     (todas idempotentes; 3.11 añade el hardening principal y 3.12 la idempotencia observable de webhooks).

4. **Opcional pero útil**: *Project Settings → Database → Connection pooling* → copia la cadena
   del puerto **6543** → `DATABASE_URL`. Con ella el panel interno muestra latencia, conexiones y
   tamaño real por tabla (`/api/admin/db`). Sin ella, todo sigue funcionando.

## Paso 3 — IA en modo gratis (2 min, opcional)

1. OpenAI → **API keys** → crea una clave → `OPENAI_API_KEY` en Vercel.
2. Deja `OPENAI_MODEL=gpt-4o-mini` (por defecto): es el más barato y sobra para responder reseñas.
3. ¿No quieres ni poner tarjeta en OpenAI? Déjalo vacío: la app usa plantillas locales y todo
   lo demás (cuotas, webhooks, panel de tokens) sigue funcionando igual. Cuando quieras calidad
   real, pega la clave y listo, sin tocar código.

## Paso 4 — Stripe en modo TEST (5 min)

1. [stripe.com](https://stripe.com) → verifica **Test mode: ON**.
2. **Developers → API keys** → `Secret key` (`sk_test_…`).
3. **Product catalog → Create product** (precios **mensuales**):
   - `ReviewFlow · Negocio` 19 €/mes → copia su **Price ID** (`STRIPE_PRICE_NEGOCIO`).
   - `ReviewFlow · Negocio Plus` 39 €/mes → `STRIPE_PRICE_NEGOCIO_PLUS`.
   - `ReviewFlow · Tiendas` 49 €/mes → `STRIPE_PRICE_TIENDAS`.
   - `ReviewFlow · Tiendas Plus` 89 €/mes → `STRIPE_PRICE_TIENDAS_PLUS`.
   (Si vienes de v3.15, `STRIPE_PRICE_PRO`/`STRIPE_PRICE_BUSINESS` siguen valiendo como
   alias de Negocio/Tiendas: no hace falta tocar los Price ID viejos para arrancar.)

   (No hay plan gratuito: los 4 planes se prueban 7 días con tarjeta de test.)
4. Opcional: crea también las 4 recargas de pago único (9 / 12 / 15 / 6 €) si quieres usar Price IDs en lugar de los importes de `lib/plans.ts`.
5. El webhook lo crearás en el paso 7 (necesitas antes la URL de Vercel).

## Paso 5 — SMTP gratis en Brevo (5 min)

1. [brevo.com](https://www.brevo.com) → cuenta Free → **SMTP & API → SMTP keys → Generate**.
2. Datos: host `smtp-relay.brevo.com`, puerto `587`.

## Paso 6 — Despliega en Vercel (5 min)

1. [vercel.com](https://vercel.com) → **Add New → Project** → **Import** tu repo → **Deploy**.
2. **Settings → Environment Variables** → añade **una por una**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Tu URL Vercel, ej. `https://tu-app.vercel.app` (sin barra final) |
| `SUPERADMIN_EMAILS` | **Tu email** (acceso al panel interno `/admin`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Paso 2 |
| `STRIPE_SECRET_KEY` | `sk_test_…` (paso 3) |
| `STRIPE_PRICE_NEGOCIO` / `STRIPE_PRICE_NEGOCIO_PLUS` / `STRIPE_PRICE_TIENDAS` / `STRIPE_PRICE_TIENDAS_PLUS` | `price_…` (paso 4) |
| `STRIPE_WEBHOOK_SECRET` | Paso 7 (despliega sin él y añádelo después) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Paso 5 |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Paso 3 (opcional; `gpt-4o-mini`) |
| `DATABASE_URL` | Paso 2 (opcional; pooler de Supabase, puerto 6543) |

3. **Deployments → ⋯ → Redeploy**.

## Paso 7 — Webhook de Stripe (3 min)

1. Stripe (**test**): **Developers → Webhooks → Add endpoint**.
2. URL: `https://tu-app.vercel.app/api/stripe/webhook` — eventos:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`, `invoice.paid`, `trial_will_end`.
3. Copia el **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET` en Vercel → **Redeploy**.

## Paso 8 — Prueba el flujo completo E2E (5 min)

1. `npm run verify` y `GET /api/health?mode=live` → `"ok":true`; el readiness requiere Bearer `HEALTHCHECK_SECRET`.
2. **Regístrate** → en `/bienvenido` verás los 4 planes de pago (2 familias):
   - cualquier plan → checkout de prueba con `4242 4242 4242 4242` (7 días sin cargo).
3. En el panel: ajusta el tono de la IA, genera un borrador y publícalo. La respuesta trae los
   **tokens y el coste reales** de esa llamada; verás la barra *Presupuesto de IA* actualizarse.
4. Comprueba la cuota y las recargas en *Facturación y cuota*.
5. Simula un impago (Stripe test: tarjeta `4000 0000 0000 0341`) → `past_due`: el panel se corta
   solo y las APIs responden 402; y una cancelación → `inactive` conservando tus datos 30 días.
6. Entra en `/admin` con tu email: verás tu empresa, la suscripción, los **tokens de IA del ciclo**
   y el webhook en **Logs**.
7. Prueba el embudo: visita `/valorar/TU-SLUG` → vota 5★ (verás los botones públicos) y
   después 2★ con mensaje (llega como ticket privado + aviso; nada se publica).
8. Visita `/sobre-nosotros` y `/contacto` (prueba el formulario: llega a tu SMTP).

## Problemas típicos

| Síntoma | Solución |
|---|---|
| `/admin` dice `forbidden` | Tu email no está en `SUPERADMIN_EMAILS` → corrige → Redeploy |
| Banner “modo demo” | Falta variable Supabase o `schema.sql` sin ejecutar |
| Tras pagar, no se crea la empresa | Revisa el webhook (paso 7) y los Logs del panel interno |
| La app “muere” al cabo de días | Supabase Free pausa el proyecto → **Resume project** |
| "La IA responde genérico" | Sin `OPENAI_API_KEY` o sin crédito: la app usa el fallback local (mira `ai_interactions.ok`) |
| "Se agotó mi IA antes de fin de mes" | Es el presupuesto de tokens del plan; compra la recarga `+500 respuestas IA` (15 €) o sube de plan |
| Google/WhatsApp dan error | Normal en gratis: esas claves son opcionales (GUIA_PASOS_MANUALES §6) |
| «Se han archivado opiniones» | Es el tope de guardadas de tu plan (3.000 en Negocio · 100.000 en Tiendas Plus): compra +2.000 opiniones o sube de plan |

## Resumen de lo que has montado gratis

| Pieza | Estado en modo gratis |
|---|---|
| 4 planes de pago + cuotas + recargas | ✅ idéntico a producción (Stripe test) |
| IA medida por tokens | ✅ presupuesto real por plan (con clave de OpenAI o con plantilla local) |
| Webhook de Stripe | ✅ mismo endpoint firmado que en live (`npm run verify` lo comprueba) |
| PostgreSQL + RLS + índices | ✅ Supabase Free (500 MB) con migración 3.13.0 |
| Protección de datos | ✅ topes por tabla, purga automática y fallbacks |
| Coste total | **0 €** hasta que decidas vender |

## Siguiente paso: vender de verdad 💰

Contrata un host de pago y sigue **[GUIA_DESPLIEGUE.md](./GUIA_DESPLIEGUE.md)** (mismo código,
claves **live** de Stripe, dominio propio). Después completa
**[GUIA_PASOS_MANUALES.md](./docs/GUIA_PASOS_MANUALES.md)** (fiscal, logo, DNS, integraciones)
y **[GUIA_AUTOMATIZACION.md](./GUIA_AUTOMATIZACION.md)** (cron, cola, plantillas, embudo).
