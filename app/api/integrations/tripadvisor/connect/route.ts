import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePaidAccess } from '@/lib/usage';
import { encryptCredentials } from '@/lib/credentials';

/**
 * Conexión con TripAdvisor — v3.14.0 sin tecnicismos: el cliente pega la
 * URL pública de su ficha (o pulsa «Conectar cuenta» en modo asistido) y el
 * backend extrae el identificador internamente.
 */

const Body = z.object({
  tenantId: z.string().min(1),
  /** Pega la URL de tu ficha en TripAdvisor (también se acepta el id directo dXXXXXX). */
  url: z.string().max(400).optional(),
  locationId: z.string().min(3).max(60).optional(),
  mode: z.enum(['assisted']).optional(),
});

/** `https://www.tripadvisor.es/Restaurant_Review-g187508-d9300252-…` → `d9300252`. */
export function extractTripadvisorLocationId(input: string): string | null {
  const m = input.trim().match(/(?:^|[-/=])d(\d{5,10})(?:[-/.?]|$)/i);
  if (m) return `d${m[1]}`;
  const direct = input.trim().match(/^d\d{5,10}$/i);
  return direct ? direct[0] : null;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  const { tenantId, mode } = parsed.data;

  let locationId: string | null = null;
  if (mode !== 'assisted') {
    locationId = extractTripadvisorLocationId(parsed.data.url ?? '') ?? (parsed.data.locationId?.trim() ?? null);
    if (!locationId) {
      return NextResponse.json(
        { error: 'Pega la URL de tu ficha en TripAdvisor (o el código «d…» que contiene).' },
        { status: 400 },
      );
    }
  }

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
    feature: 'tripadvisor',
    action: 'Conexión con TripAdvisor',
    metric: 'syncs',
  });
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }

  if (mode === 'assisted') {
    const { error: saveError } = await admin.from('integrations').upsert(
      {
        tenant_id: tenantId,
        provider: 'tripadvisor',
        status: 'pending_setup',
        credentials: encryptCredentials({ mode: 'assisted', requestedAt: new Date().toISOString() }),
        external_label: 'TripAdvisor',
        last_error: null,
      },
      { onConflict: 'tenant_id,provider' },
    );
    if (saveError) return NextResponse.json({ error: 'No se pudo guardar la conexión.' }, { status: 500 });
    return NextResponse.json({
      ok: true,
      status: 'pending_setup',
      message: 'Solicitud recibida. Buscamos tu ficha en TripAdvisor y te avisamos cuando quede conectada.',
    });
  }

  const { error: saveError } = await admin.from('integrations').upsert(
    {
      tenant_id: tenantId,
      provider: 'tripadvisor',
      status: 'connected',
      credentials: encryptCredentials({ locationId: locationId as string }),
      external_label: 'TripAdvisor',
      last_error: null,
    },
    { onConflict: 'tenant_id,provider' },
  );
  if (saveError) return NextResponse.json({ error: 'No se pudo guardar la integración.' }, { status: 500 });

  return NextResponse.json({ ok: true, message: 'TripAdvisor conectado. Pulsa «Sincronizar» para importar.' });
}
