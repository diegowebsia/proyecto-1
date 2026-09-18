/** Datos de demostración coherentes para modo sin-BD (panel admin + dashboard). */

/** Sin dependencias de servidor: este módulo también lo consumen las páginas demo. */
import type { PlanId } from '@/lib/plans';

export type DemoTenant = {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  plan: PlanId;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive' | 'none';
  stripe_customer_id: string | null;
  reviews_count: number;
  ai_replies_count: number;
  mrr_cents: number;
  created_at: string;
  suspended: boolean;
};

export const demoTenants: DemoTenant[] = [
  {
    id: 'demo-t-1',
    name: 'Clínica Dental Sonrisa',
    slug: 'clinica-sonrisa',
    owner_email: 'hola@clinica-sonrisa.es',
    plan: 'negocio_plus',
    subscription_status: 'active',
    stripe_customer_id: 'cus_demo_001',
    reviews_count: 342,
    ai_replies_count: 318,
    mrr_cents: 3900,
    created_at: '2025-05-02T10:00:00Z',
    suspended: false,
  },
  {
    id: 'demo-t-2',
    name: 'Restaurante La Brasa',
    slug: 'la-brasa',
    owner_email: 'reservas@labrasa.es',
    plan: 'negocio',
    subscription_status: 'active',
    stripe_customer_id: 'cus_demo_002',
    reviews_count: 187,
    ai_replies_count: 150,
    mrr_cents: 1900,
    created_at: '2025-08-19T10:00:00Z',
    suspended: false,
  },
  {
    id: 'demo-t-3',
    name: 'Taller Rueda Libre',
    slug: 'rueda-libre',
    owner_email: 'taller@ruedalibre.es',
    plan: 'negocio',
    subscription_status: 'trialing',
    stripe_customer_id: 'cus_demo_003',
    reviews_count: 24,
    ai_replies_count: 9,
    mrr_cents: 1900,
    created_at: '2026-09-01T10:00:00Z',
    suspended: false,
  },
];

export type DemoReview = {
  id: string;
  tenant: string;
  tenant_id?: string;
  author: string;
  rating: number;
  text: string;
  source: 'google' | 'trustpilot' | 'facebook';
  created_at: string;
  replied: boolean;
  /** Dir. UE 2019/2161: la plataforma de origen confirma consumo real. */
  verified: boolean;
  /** v3.4.0: gestión privada (≤3★) + nota de seguimiento. */
  flagged_private?: boolean;
  private_note?: string | null;
  reply?: string | null;
};

export const demoReviews: DemoReview[] = [
  {
    id: 'demo-r-1',
    tenant: 'Clínica Dental Sonrisa',
    author: 'María G.',
    rating: 5,
    text: 'Trato increíble desde que entras por la puerta. Sin dolor y rapidísimos.',
    source: 'google',
    created_at: '2026-09-15T09:12:00Z',
    replied: true,
    verified: true,
  },
  {
    id: 'demo-r-2',
    tenant: 'Clínica Dental Sonrisa',
    author: 'Javier R.',
    rating: 2,
    text: 'Me cambiaron la cita dos veces sin avisar con tiempo. Espero que mejoren.',
    source: 'google',
    created_at: '2026-09-14T18:40:00Z',
    replied: false,
    verified: true,
    flagged_private: true,
    private_note: null,
  },
  {
    id: 'demo-r-3',
    tenant: 'Restaurante La Brasa',
    author: 'Lucía F.',
    rating: 4,
    text: 'La carne espectacular, el servicio un poco lento en hora punta.',
    source: 'trustpilot',
    created_at: '2026-09-13T21:05:00Z',
    replied: false,
    verified: false,
  },
];

export function demoStats() {
  const mrrCents = demoTenants.reduce((a, t) => a + t.mrr_cents, 0);
  return {
    tenants: demoTenants.length,
    activeSubscriptions: demoTenants.filter((t) => t.subscription_status === 'active').length,
    mrrCents,
    mrrFormatted: `${(mrrCents / 100).toFixed(2)} €`,
    reviewsTotal: demoTenants.reduce((a, t) => a + t.reviews_count, 0),
    aiRepliesTotal: demoTenants.reduce((a, t) => a + t.ai_replies_count, 0),
    // Control de coste de IA (modo demo): tokens del ciclo y coste estimado.
    aiTokensCycle: 214_800,
    aiCostCycleUsd: 0.045,
    aiFallbacksCycle: 1,
    aiModel: 'gpt-4o-mini',
    trialCount: demoTenants.filter((t) => t.subscription_status === 'trialing').length,
  };
}

/* ------------------------------------------------------------------ */
/* v3.14.0 — Vista demo del panel: datos simulados por plan  */
/*                     y snapshot de uso para los paneles del panel.   */
/* ------------------------------------------------------------------ */

import type { TenantInfo, UsageResponse } from '@/components/dashboard/types';
import {
  ADDON_CATALOG,
  PLAN_CATALOG,
  formatEur,
  planOf,
  renewalLabel,
  type UsageMetric,
} from '@/lib/plans';

export type DemoPlanId = PlanId;

/* ------------------------------------------------------------------ */
/* Personas de demostración: una por plan (bar, clínica, tienda y      */
/* multi-marca). La demo debe enseñar EXACTAMENTE lo que vería un       */
/* cliente real de ese plan.                                            */
/* ------------------------------------------------------------------ */

type DemoPersona = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  web: string;
  type: string;
  tone: 'cercano' | 'profesional' | 'formal';
  rating: number;
  /** % del ciclo consumido en los medidores simulados. */
  ratio: number;
  commerce: boolean;
  reviewsCount: number;
  whatsappSent: number;
  googleCalls: number;
};

const PERSONAS: Record<DemoPlanId, DemoPersona> = {
  negocio: {
    name: 'Bar Lumen',
    slug: 'demo-bar-lumen',
    email: 'hola@barlumen.demo',
    phone: '+34 910 000 111',
    web: 'barlumen.demo',
    type: 'bar de barrio con terraza',
    tone: 'cercano',
    rating: 4.4,
    ratio: 0.58,
    commerce: false,
    reviewsCount: 3,
    whatsappSent: 41,
    googleCalls: 22,
  },
  negocio_plus: {
    name: 'Clínica Dental Sonrisa',
    slug: 'demo-sonrisa',
    email: 'citas@sonrisa.demo',
    phone: '+34 910 000 222',
    web: 'clinicasonrisa.demo',
    type: 'clínica dental con 5 sedes',
    tone: 'profesional',
    rating: 4.8,
    ratio: 0.47,
    commerce: false,
    reviewsCount: 4,
    whatsappSent: 63,
    googleCalls: 35,
  },
  tiendas: {
    name: 'Aurora Home',
    slug: 'demo-aurora-home',
    email: 'hola@aurorahome.demo',
    phone: '+34 910 000 333',
    web: 'aurorahome.demo',
    type: 'tienda online de decoración (dropshipping)',
    tone: 'cercano',
    rating: 4.6,
    ratio: 0.42,
    commerce: true,
    reviewsCount: 5,
    whatsappSent: 132,
    googleCalls: 64,
  },
  tiendas_plus: {
    name: 'MultiDeco',
    slug: 'demo-multideco',
    email: 'atencion@multideco.demo',
    phone: '+34 910 000 444',
    web: 'multideco.demo',
    type: 'ecommerce de hogar y jardín multi-marca',
    tone: 'profesional',
    rating: 4.5,
    ratio: 0.36,
    commerce: true,
    reviewsCount: 6,
    whatsappSent: 402,
    googleCalls: 180,
  },
};

/** Empresa de ejemplo para la vista demo, con su plan real de catálogo. */
export function demoTenantFor(plan: DemoPlanId): TenantInfo {
  const now = new Date();
  const persona = PERSONAS[plan];
  return {
    id: `demo-prev-${plan}`,
    name: persona.name,
    slug: persona.slug,
    plan,
    subscription_status: 'trialing',
    suspended: false,
    trial_ends_at: new Date(now.getTime() + 5 * 86_400_000).toISOString(),
    access: true,
    settings: {
      tone: persona.tone,
      business_type: persona.type,
      contact_email: persona.email,
      contact_phone: persona.phone,
      website: persona.web,
      place_id: 'ChIJL2OmBZ2bUg0R2HfHtIz4Gk (demo)',
      place_rating: persona.rating,
      whatsapp_to: '34600000000',
      tripadvisor_url: persona.commerce ? undefined : 'https://www.tripadvisor.es/Attraction_Review-demo',
      trustpilot_url: 'https://es.trustpilot.com/review/demo.es',
      funnel_enabled: true,
    },
    integrations: persona.commerce
      ? [
          { provider: 'google', status: 'connected', last_sync_at: new Date(now.getTime() - 2 * 60_000).toISOString() },
          { provider: 'trustpilot', status: 'connected', last_sync_at: new Date(now.getTime() - 6 * 3_600_000).toISOString() },
          { provider: 'shopify', status: 'connected', last_sync_at: new Date(now.getTime() - 26 * 3_600_000).toISOString() },
          { provider: 'tripadvisor', status: 'pending_setup', last_sync_at: null },
        ]
      : [
          { provider: 'google', status: 'connected', last_sync_at: new Date(now.getTime() - 3 * 3_600_000).toISOString() },
          { provider: 'whatsapp', status: 'connected', last_sync_at: null },
          { provider: 'tripadvisor', status: 'connected', last_sync_at: new Date(now.getTime() - 8 * 3_600_000).toISOString() },
          { provider: 'trustpilot', status: 'pending_setup', last_sync_at: null },
        ],
  };
}

/** Banco de reseñas por tipo de negocio (cada demo ve las suyas, coherentes con su sector). */
function personaReviews(persona: DemoPersona, tenant: string): DemoReview[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const local: DemoReview[] = [
    {
      id: 'prev-r-1', tenant, author: 'Marta G.', rating: 5,
      text: 'Trato increíble desde que cruzas la puerta. Se nota que conocen a todo el barrio.',
      source: 'google', created_at: daysAgo(1), replied: true, verified: true,
      reply: `Hola Marta, muchísimas gracias por tu reseña. Que se sienta como en casa es justo lo que buscamos en ${tenant}. ¡Te esperamos en la terraza!`,
    },
    {
      id: 'prev-r-2', tenant, author: 'Javier R.', rating: 2,
      text: 'Tuvimos que esperar bastante un viernes por la noche y nadie nos avisó. Mejorable.',
      source: 'google', created_at: daysAgo(2), replied: false, verified: true,
      flagged_private: true, private_note: 'Llamado a las 10:15. Reconocido el pico del viernes, reservaremos su mesa preferente el jueves. Sin escalamiento.',
    },
    {
      id: 'prev-r-3', tenant, author: 'Lucía F.', rating: 4,
      text: 'Muy bien en general; en hora punta el servicio fue un poco lento.',
      source: 'google', created_at: daysAgo(3), replied: false, verified: false,
    },
  ];
  const extraClinic: DemoReview[] = [
    {
      id: 'prev-r-4', tenant, author: 'Andrés M.', rating: 5,
      text: 'Me quitaron el dolor el mismo día y con muchísima paciencia. 10/10.',
      source: 'trustpilot', created_at: daysAgo(4), replied: false, verified: true,
    },
  ];
  const commerce: DemoReview[] = [
    {
      id: 'prev-c-1', tenant, author: 'Óscar P.', rating: 5,
      text: 'Pedí online y en dos días lo tenía en casa, con avisos por WhatsApp en todo momento.',
      source: 'trustpilot', created_at: daysAgo(4), replied: true, verified: true,
      reply: '¡Gracias, Óscar! Nos encanta que el seguimiento te haya dado tranquilidad. Para lo que necesites, aquí estamos.',
    },
    {
      id: 'prev-c-2', tenant, author: 'Ana V.', rating: 3,
      text: 'La calidad es buena, pero tardó más de lo prometido en llegar.',
      source: 'trustpilot', created_at: daysAgo(5), replied: false, verified: true,
      flagged_private: true, private_note: null,
    },
    {
      id: 'prev-c-3', tenant, author: 'Rafael S.', rating: 5,
      text: 'Atención de 10. Resolvieron una incidencia de mi pedido el mismo día.',
      source: 'google', created_at: daysAgo(6), replied: true, verified: true,
      reply: 'Rafael, mil gracias. Resolver rápido es nuestra prioridad; nos alegra haberlo conseguido contigo.',
    },
  ];
  const pool = persona.commerce
    ? [...local.slice(0, 1), ...commerce, local[2]]
    : persona.type.includes('clínica')
      ? [...local, ...extraClinic]
      : local;
  return pool.slice(0, Math.max(1, persona.reviewsCount));
}

/** Reseñas simuladas coherentes con el plan (más fuentes y volumen cuanto mayor es el plan). */
export function demoReviewsFor(plan: DemoPlanId): DemoReview[] {
  const persona = PERSONAS[plan];
  return personaReviews(persona, persona.name);
}

/** Snapshot simulado de cuota/almacenamiento/IA con la misma forma que `/api/tenants/usage`. */
export function demoUsageFor(plan: DemoPlanId): UsageResponse {
  const persona = PERSONAS[plan];
  const p = planOf(plan);
  const ratio = persona.ratio; // % consumido del ciclo
  const mk = (quota: number, r: number): UsageResponse['metrics'][UsageMetric] => {
    const used = Math.max(1, Math.round(quota * r));
    const pct = Math.round((used / Math.max(1, quota)) * 100);
    return { used, quota, remaining: Math.max(0, quota - used), allowed: true, pct };
  };
  const metrics = {
    requests: mk(p.limits.requestsPerMonth, ratio),
    reviews: mk(p.limits.reviewsPerMonth, ratio * 0.8),
    ai: mk(p.limits.aiRepliesPerMonth, ratio * 1.15),
    syncs: mk(p.limits.syncsPerMonth, ratio * 0.9),
  };
  const tokensUsed = Math.round(p.limits.aiTokensPerMonth * ratio * 0.9);
  const storedUsed = Math.round(p.limits.reviewsStored * (0.2 + ratio * 0.3));
  const auditUsed = Math.round(p.limits.auditRows * 0.3);
  const cap = (capV: number, used: number, label: string) => {
    const pct = Math.round((used / Math.max(1, capV)) * 100);
    return { used, quota: capV, remaining: Math.max(0, capV - used), allowed: true, pct, label, cap: capV };
  };
  const usedMb = Math.round((storedUsed * 1.4) / 1024);
  const now = new Date();
  const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    ok: true,
    plan: plan,
    planLabel: p.label,
    tier: p.tier,
    cycle,
    metrics,
    aiUsage: {
      tokensUsed,
      tokensLimit: p.limits.aiTokensPerMonth,
      tokensRemaining: Math.max(0, p.limits.aiTokensPerMonth - tokensUsed),
      pct: Math.round((tokensUsed / p.limits.aiTokensPerMonth) * 100),
      requests: metrics.ai.used,
    },
    limits: {
      requestsPerMonth: p.limits.requestsPerMonth,
      reviewsPerMonth: p.limits.reviewsPerMonth,
      aiRepliesPerMonth: p.limits.aiRepliesPerMonth,
      aiTokensPerMonth: p.limits.aiTokensPerMonth,
      syncsPerMonth: p.limits.syncsPerMonth,
      locations: p.limits.locations,
    },
    used: metrics.requests.used,
    limit: metrics.requests.quota,
    remaining: metrics.requests.remaining,
    allowed: true,
    blockedBy: null,
    storage: {
      reviews: cap(p.limits.reviewsStored, storedUsed, 'Opiniones guardadas'),
      audit: cap(p.limits.auditRows, auditUsed, 'Auditoría'),
      integrations: cap(p.limits.integrations, persona.commerce ? 3 : 2, 'Conexiones'),
      ai: cap(p.limits.aiRows, metrics.ai.used * 2, 'Contabilidad IA'),
      limitMb: Math.round(p.limits.storageMb),
      usedMb,
      remainingMb: Math.max(0, Math.round(p.limits.storageMb) - usedMb),
      pct: Math.min(99, Math.round((usedMb / Math.max(1, p.limits.storageMb)) * 100)),
      logRetentionDays: p.limits.logRetentionDays,
    },
    storageLimitMb: Math.round(p.limits.storageMb),
    storageUsedMb: usedMb,
    extras: { requests: 0, reviews: persona.commerce ? 2000 : 0, ai: 0, syncs: 0, stored: 0 },
    packs: persona.commerce ? 1 : 0,
    catalog: ADDON_CATALOG.map((a) => ({
      id: a.id, name: a.name, description: a.description, priceCents: a.priceCents,
      price: formatEur(a.priceCents), metric: a.metric, amount: a.amount, badge: a.badge ?? null,
    })),
    counters: {
      reviews_ingested: metrics.reviews.used,
      ai_replies: metrics.ai.used,
      whatsapp_sent: persona.whatsappSent,
      google_calls: persona.googleCalls,
      ai_tokens_in: Math.round(tokensUsed * 0.62),
      ai_tokens_out: Math.round(tokensUsed * 0.38),
    },
    features: p.features as unknown as Record<string, boolean | string>,
    renewalAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    renewalLabel: renewalLabel(now),
    hasAccess: true,
  };
}

/** Estadísticas simuladas del embudo de valoración (pestaña Embudo). */
export function demoFunnelStats(): {
  total: number;
  avgStars: number;
  clicks: number;
  ticketsOpen: number;
  byStars: Record<1 | 2 | 3 | 4 | 5, number>;
  byChannel: { google: number; tripadvisor: number; trustpilot: number; none: number };
  campaigns: Array<{ campaign: string; votes: number; clicks: number; tickets: number }>;
} {
  return {
    total: 214,
    avgStars: 4.4,
    clicks: 173,
    ticketsOpen: 2,
    byStars: { 1: 6, 2: 9, 3: 15, 4: 52, 5: 132 },
    byChannel: { google: 131, tripadvisor: 18, trustpilot: 24, none: 41 },
    campaigns: [
      { campaign: 'mostrador', votes: 96, clicks: 81, tickets: 1 },
      { campaign: 'whatsapp-postventa', votes: 74, clicks: 62, tickets: 0 },
      { campaign: 'ticket-papel', votes: 44, clicks: 30, tickets: 1 },
    ],
  };
}

export const DEMO_PLANS = PLAN_CATALOG.map((p) => ({ id: p.id, name: p.name, tier: p.tier }));
