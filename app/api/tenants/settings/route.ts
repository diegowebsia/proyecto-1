import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractPlaceId } from '@/lib/maps';

const emptyToUndef = (v: string | undefined) => (v === undefined ? undefined : v.trim() || undefined);

const Body = z.object({
  tenantId: z.string().min(1),
  tone: z.enum(['profesional', 'cercano', 'formal']).optional(),
  place_id: z.string().max(120).optional(),
  whatsapp_to: z.string().max(20).optional(),
  tripadvisor_url: z.string().max(300).optional(),
  trustpilot_url: z.string().max(300).optional(),
  funnel_enabled: z.boolean().optional(),
  /** Sector del negocio (bar, clínica, taller…): personaliza el vocabulario de la IA. */
  business_type: z.string().trim().max(80).optional(),
  /** Contacto PROPIO del negocio: la IA solo ofrece estos canales en sus textos. */
  contact_email: z
    .union([z.literal(''), z.string().email('Ese email no parece válido.').max(160)])
    .optional(),
  contact_phone: z.string().max(24).optional(),
  website: z.string().max(200).optional(),
});

/** Guarda ajustes de la empresa (tono IA, Place ID, móvil WhatsApp, URLs del embudo). */
export async function PATCH(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 });
  const { tenantId, ...rest } = parsed.data;
  const patch = {
    ...rest,
    contact_phone: emptyToUndef(rest.contact_phone),
    website: emptyToUndef(rest.website),
  };
  if (patch.contact_email === '') patch.contact_email = undefined;

  // v3.14.0: el cliente pega el enlace de su ficha de Google; aquí se normaliza
  // al identificador interno. Si no se reconoce ni siquiera un id, se avisa en
  // lenguaje claro (nunca se guarda una URL por error).
  if (patch.place_id) {
    const pid = extractPlaceId(patch.place_id);
    if (!pid) {
      return NextResponse.json(
        { error: 'No reconocemos ese enlace. Copia la dirección de tu ficha en Google Maps (o de «Compartir → Copiar enlace»).' },
        { status: 400 },
      );
    }
    patch.place_id = pid;
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
  if (!member) return NextResponse.json({ error: 'Sin permiso en esta empresa.' }, { status: 403 });

  const { data: tenant } = await admin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  const settings = { ...((tenant?.settings as object) ?? {}), ...patch };
  const { error } = await admin.from('tenants').update({ settings }).eq('id', tenantId);
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });

  return NextResponse.json({ ok: true, settings });
}
