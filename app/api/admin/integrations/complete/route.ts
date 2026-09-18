import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdminMfa } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { systemLog } from '@/lib/logger';
import { decryptCredentials, encryptCredentials } from '@/lib/credentials';
import { payloadErrorResponse, readJsonLimited } from '@/lib/request';

/**
 * Gestión de CONEXIONES ASISTIDAS pendientes (v3.14.0) — solo /admin.
 *
 * El panel del cliente ya no pide claves ni secretos: registra la solicitud
 * (`pending_setup`) y aquí el dueño del proyecto la completa:
 *
 *   · action 'complete' — guarda las credenciales del proveedor (se cifran
 *     con INTEGRATION_ENCRYPTION_KEY) y activa la conexión.
 *   · action 'reject'   — la rechaza con motivo visible para el equipo y
 *     deja la integración como desconectada.
 *
 * Ambas acciones auditables: `admin_audit_events` + log del sistema.
 */

const Body = z.object({
  integrationId: z.string().uuid(),
  action: z.enum(['complete', 'reject']),
  provider: z.enum(['shopify', 'woocommerce', 'store', 'trustpilot', 'tripadvisor']),
  webhook_secret: z.string().min(8).max(200).optional(),
  apiKey: z.string().min(5).max(200).optional(),
  businessUnitId: z.string().min(5).max(100).optional(),
  locationId: z.string().min(3).max(60).optional(),
  reason: z.string().min(5).max(300).optional(),
});

export async function POST(req: Request) {
  const guard = await requireSuperAdminMfa();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  let input: unknown;
  try {
    input = await readJsonLimited(req, 8192);
  } catch (error) {
    return payloadErrorResponse(error) ?? NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const parsed = Body.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: 'Datos de la conexión no válidos.' }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 503 });

  const d = parsed.data;
  const { data: integration, error: loadError } = await admin
    .from('integrations')
    .select('id, tenant_id, provider, status, credentials')
    .eq('id', d.integrationId)
    .single();
  if (loadError || !integration) return NextResponse.json({ error: 'Conexión no encontrada.' }, { status: 404 });

  if (d.action === 'reject') {
    const { error } = await admin
      .from('integrations')
      .update({ status: 'disconnected', last_error: d.reason ?? 'Rechazada por el operador' })
      .eq('id', d.integrationId);
    if (error) return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 });
    await audit(admin, guard.email, 'integration_request_rejected', integration.tenant_id, d.reason ?? 'sin motivo');
    await systemLog('warn', 'admin.integrations', `Conexión ${integration.provider} rechazada`, {
      by: guard.email,
      tenantId: integration.tenant_id,
    });
    return NextResponse.json({ ok: true, message: 'Solicitud rechazada.' });
  }

  // complete: credenciales por proveedor (se conservan las ya guardadas de la solicitud).
  let previous: Record<string, unknown> = {};
  try {
    previous = decryptCredentials<Record<string, unknown>>(integration.credentials) ?? {};
  } catch {
    /* credenciales legacy o illegibles: se sobrescriben */
  }
  const creds: Record<string, unknown> = { ...previous, mode: 'admin_setup', completedAt: new Date().toISOString() };
  if (d.provider === 'shopify' || d.provider === 'woocommerce' || d.provider === 'store') {
    if (!d.webhook_secret) return NextResponse.json({ error: 'Falta el secreto del webhook.' }, { status: 400 });
    creds.webhook_secret = d.webhook_secret;
  } else if (d.provider === 'trustpilot') {
    if (!d.apiKey || !d.businessUnitId) {
      return NextResponse.json({ error: 'Faltan API key y Business Unit ID de Trustpilot.' }, { status: 400 });
    }
    creds.apiKey = d.apiKey;
    creds.businessUnitId = d.businessUnitId;
  } else if (d.provider === 'tripadvisor') {
    if (!d.locationId) return NextResponse.json({ error: 'Falta el Location ID (dXXXXXX).' }, { status: 400 });
    creds.locationId = d.locationId;
  }

  const { error: updateError } = await admin
    .from('integrations')
    .update({ status: 'connected', credentials: encryptCredentials(creds), last_error: null })
    .eq('id', d.integrationId)
    .eq('status', 'pending_setup');
  if (updateError) return NextResponse.json({ error: 'No se pudo activar la conexión.' }, { status: 500 });

  await audit(admin, guard.email, 'integration_request_completed', integration.tenant_id, d.provider);
  await systemLog('info', 'admin.integrations', `Conexión ${integration.provider} activada`, {
    by: guard.email,
    tenantId: integration.tenant_id,
  });
  return NextResponse.json({ ok: true, message: 'Conexión activada. El cliente ya puede sincronizar.' });
}

async function audit(admin: ReturnType<typeof createAdminClient>, email: string, action: string, tenantId: string, detail: string) {
  if (!admin) return;
  await admin.from('admin_audit_events').insert({
    actor_email: email,
    action,
    tenant_id: tenantId,
    reason: detail.slice(0, 500),
  });
}

/** Listado ligero para el panel /admin (pendientes de completar). */
export async function GET() {
  const guard = await requireSuperAdminMfa();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 503 });
  const { data, error } = await admin
    .from('integrations')
    .select('id, tenant_id, provider, created_at, tenants(name)')
    .eq('status', 'pending_setup')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: 'No se pudo leer la cola.' }, { status: 500 });
  return NextResponse.json({ ok: true, pending: data ?? [] });
}
