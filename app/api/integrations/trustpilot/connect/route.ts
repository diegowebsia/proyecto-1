import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePaidAccess } from '@/lib/usage';
import { encryptCredentials } from '@/lib/credentials';

/**
 * Conexión con Trustpilot — v3.14.0: el cliente solo pulsa «Conectar cuenta».
 *
 *  · `mode: 'assisted'` (UI del cliente): registra `pending_setup`; las
 *    credenciales de la API de Trustpilot las introduce el dueño del proyecto
 *    desde /admin → Conexiones pendientes. Cero campos técnicos en el panel.
 *  · Con `apiKey + businessUnitId` (uso interno/admin): guarda y activa.
 */

const Body = z.object({
  tenantId: z.string().min(1),
  mode: z.enum(['assisted']).optional(),
  apiKey: z.string().min(5).max(200).optional(),
  businessUnitId: z.string().min(5).max(100).optional(),
});

/** El modo completo exige credenciales; el asistido, ninguna. */
function validInput(d: z.infer<typeof Body>): boolean {
  if (d.mode === 'assisted') return true;
  return Boolean(d.apiKey && d.businessUnitId);
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !validInput(parsed.data)) {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }
  const { tenantId, mode, apiKey, businessUnitId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 503 });

  const { data: member } = await admin
    .from('memberships')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });

  // Regla estricta: sin suscripción activa o con la prueba caducada → 402.
  const gate = await requirePaidAccess(admin, tenantId, {
    feature: 'trustpilot',
    action: 'Conexión con Trustpilot',
    metric: 'syncs',
  });
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }

  if (mode === 'assisted') {
    const { error: saveError } = await admin.from('integrations').upsert(
      {
        tenant_id: tenantId,
        provider: 'trustpilot',
        status: 'pending_setup',
        credentials: encryptCredentials({ mode: 'assisted', requestedAt: new Date().toISOString() }),
        external_label: 'Trustpilot Business',
        last_error: null,
      },
      { onConflict: 'tenant_id,provider' },
    );
    if (saveError) return NextResponse.json({ error: 'No se pudo guardar la conexión.' }, { status: 500 });
    return NextResponse.json({
      ok: true,
      status: 'pending_setup',
      message:
        'Solicitud recibida. Conectamos tu cuenta de Trustpilot por ti y te avisamos cuando esté sincronizando (menos de 24 h laborables).',
    });
  }

  const { error: saveError } = await admin.from('integrations').upsert(
    {
      tenant_id: tenantId,
      provider: 'trustpilot',
      status: 'connected',
      credentials: encryptCredentials({ apiKey, businessUnitId }),
      external_label: 'Trustpilot Business',
      last_error: null,
    },
    { onConflict: 'tenant_id,provider' },
  );
  if (saveError) return NextResponse.json({ error: 'No se pudo guardar la integración.' }, { status: 500 });

  return NextResponse.json({ ok: true, message: 'Trustpilot conectado. Pulsa «Sincronizar» para importar.' });
}
