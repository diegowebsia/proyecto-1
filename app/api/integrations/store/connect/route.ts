import { NextResponse } from 'next/server';
import { planOf } from '@/lib/plans';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePaidAccess } from '@/lib/usage';
import { encryptCredentials } from '@/lib/credentials';
import { env } from '@/lib/env';

/**
 * Conexión con la tienda — v3.14.0: dos modos.
 *
 *  · `mode: 'assisted'` (UI del cliente): el cliente pulsa «Conectar cuenta»
 *    y NO introduce ninguna clave. Se registra la integración en estado
 *    `pending_setup`; el dueño la completa desde /admin (sección Conexiones
 *    pendientes) con el secreto del webhook. Es el único camino expuesto al
 *    cliente.
 *  · Sin `mode` (uso interno/admin): guarda ya el `webhook_secret` y la deja
 *    `connected` (se conserva por compatibilidad con automatizaciones).
 */

const Body = z.object({
  tenantId: z.string().min(1),
  provider: z.enum(['shopify', 'woocommerce', 'store']),
  mode: z.enum(['assisted', 'disconnect']).optional(),
  shop: z.string().max(200).optional(),
  webhook_secret: z.string().min(8).max(200).optional(),
});

async function loadContext(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) } as const;

  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: 'Supabase no configurado.' }, { status: 503 }) } as const;
  void req;
  return { user, admin } as const;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Proveedor no válido.' }, { status: 400 });
  }
  const { tenantId, provider, mode, shop, webhook_secret } = parsed.data;

  const ctx = await loadContext(req);
  if ('error' in ctx) return ctx.error;
  const { user, admin } = ctx;

  const { data: member } = await admin
    .from('memberships')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });

  // Regla estricta: sin suscripción activa o con la prueba caducada → 402.
  const gate = await requirePaidAccess(admin, tenantId, {
    feature: 'storeIntegration',
    action: 'Conexión con tienda',
    metric: 'syncs',
  });
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }

  const { data: tenant } = await admin.from('tenants').select('plan').eq('id', tenantId).single();
  if (!planOf(tenant?.plan).features.storeIntegration) {
    return NextResponse.json(
      {
        error: 'Conectar tu tienda está disponible en los planes Tiendas y Tiendas Plus (incluyen el WhatsApp automático al entregar).',
        code: 'plan_locked',
        upgradePlan: planOf(tenant?.plan).track === 'local' ? 'tiendas' : 'tiendas_plus',
      },
      { status: 403 },
    );
  }

  const label = provider === 'shopify' ? 'Shopify' : provider === 'woocommerce' ? 'WooCommerce' : 'Tienda a medida';

  // ── Baja de la conexión ─────────────────────────────────────────────────
  if (mode === 'disconnect') {
    const { error: delError } = await admin
      .from('integrations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('provider', provider);
    if (delError) return NextResponse.json({ error: 'No se pudo desconectar.' }, { status: 500 });
    return NextResponse.json({ ok: true, message: 'Conexión con la tienda retirada.' });
  }

  // ── Modo asistido (cliente): 1 clic, cero claves ────────────────────────
  if (mode === 'assisted') {
    const { error: saveError } = await admin.from('integrations').upsert(
      {
        tenant_id: tenantId,
        provider,
        status: 'pending_setup',
        credentials: encryptCredentials({ mode: 'assisted', shop: shop ?? null, requestedAt: new Date().toISOString() }),
        external_label: label,
        last_error: null,
      },
      { onConflict: 'tenant_id,provider' },
    );
    if (saveError) return NextResponse.json({ error: 'No se pudo guardar la integración.' }, { status: 500 });
    return NextResponse.json({
      ok: true,
      status: 'pending_setup',
      message: `Solicitud recibida. Nuestro equipo termina la conexión con ${label} y te avisa en cuanto quede activa (menos de 24 h laborables).`,
    });
  }

  // ── Modo completo (uso interno): secreto + URL de webhook ───────────────
  if (!webhook_secret || webhook_secret.length < 8) {
    return NextResponse.json(
      { error: 'Falta el secreto del webhook (solo lo introduce el administrador).' },
      { status: 400 },
    );
  }
  const { error: saveError } = await admin.from('integrations').upsert(
    {
      tenant_id: tenantId,
      provider,
      status: 'connected',
      credentials: encryptCredentials({ webhook_secret }),
      external_label: label,
      last_error: null,
    },
    { onConflict: 'tenant_id,provider' },
  );
  if (saveError) return NextResponse.json({ error: 'No se pudo guardar la integración.' }, { status: 500 });

  const base = env.appUrl.replace(/\/$/, '');
  const webhookUrl = `${base}/api/integrations/${provider === 'store' ? 'woocommerce' : provider}/webhook?tenant=${encodeURIComponent(tenantId)}`;
  return NextResponse.json({
    ok: true,
    webhookUrl,
    message: 'Secreto guardado. La conexión queda activa.',
  });
}
