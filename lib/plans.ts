/**
 * ============================================================
 * ReviewFlow AI — Catálogo comercial de planes (v3.13.0)
 * ============================================================
 * 100% client-safe: este fichero NO importa nada de Node ni de Supabase,
 * por lo que puede usarse en la landing, el dashboard y el servidor.
 *
 * MODELO 100% DE PAGO — 4 planes (2 tracks × 2 niveles), sin plan gratuito:
 *
 *   TRACK NEGOCIOS LOCALES (reseñas + IA; sin tienda):
 *   · `negocio`        → Negocio        ·  19 €/mes
 *   · `negocio_plus`   → Negocio Plus   ·  39 €/mes  (mismos módulos, límites ×3)
 *   TRACK COMERCIO ONLINE (lo mismo + tienda y WhatsApp al entregar):
 *   · `tiendas`        → Tiendas        ·  49 €/mes
 *   · `tiendas_plus`   → Tiendas Plus   ·  89 €/mes  (límites ×3 y 30 sedes)
 *
 * Todos los planes de pago incluyen {TRIAL_DAYS} días de prueba gratis con
 * tarjeta (`trial_period_days: 7` en Stripe Checkout). Sin suscripción activa
 * (o con la prueba caducada) la plataforma responde 402 (Payment Required).
 *
 * Cada plan define 3 cosas fáciles de explicar a un cliente:
 *   1. LÍMITES MENSUALES (`limits.*PerMonth`): peticiones de opiniones
 *      (email + WhatsApp), opiniones importadas, respuestas con IA y
 *      sincronizaciones automáticas con Google/Trustpilot/TripAdvisor.
 *   2. TOPES DE BASE DE DATOS (`limits.reviewsStored`, `auditRows`,
 *      `integrations`, `logRetentionDays`): cuántas filas puede retener
 *      cada empresa para que PostgreSQL/Supabase nunca se desborde.
 *   3. FEATURES (`features`): qué integraciones están habilitadas. La gran
 *      diferencia entre tracks: `storeIntegration` + `whatsappOrders` SOLO en
 *      los planes Tiendas (e-commerce y dropshipping).
 *
 * Los planes antiguos (`free`, `trial`, `resenas`, `completo`, `pro`,
 * `business`…) siguen resolviéndose por compatibilidad con las filas ya
 * guardadas en la base de datos, siempre hacia un plan DE PAGO:
 *   pro/free/trial → negocio · business/completo/enterprise → tiendas.
 */

export type PlanId = 'negocio' | 'negocio_plus' | 'tiendas' | 'tiendas_plus';

/** Métricas medibles contra `usage_counters` (una columna física por métrica). */
export type UsageMetric = 'requests' | 'reviews' | 'ai' | 'syncs';

/** Nombre corto de la métrica para mensajes de error y cabeceras. */
export const METRIC_LABEL: Record<UsageMetric, string> = {
  requests: 'peticiones de opiniones',
  reviews: 'opiniones importadas',
  ai: 'respuestas con IA',
  syncs: 'sincronizaciones automáticas',
};

/** Alias comercial corto (usado en marketing). */
export const PLAN_ALIASES: Record<PlanId, string> = {
  negocio: 'Negocio',
  negocio_plus: 'Negocio Plus',
  tiendas: 'Tiendas',
  tiendas_plus: 'Tiendas Plus',
};

/**
 * Días de prueba gratuita con tarjeta para los planes de pago.
 * Se aplica como `trial_period_days: 7` en Stripe Checkout
 * (ver `app/api/stripe/checkout/route.ts`).
 */
export const TRIAL_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Límites por plan                                                    */
/* ------------------------------------------------------------------ */

/**
 * Estimación de peso por fila en PostgreSQL (usada para el medidor de
 * «almacenamiento activo» del panel y para las guías técnicas).
 * Son medias conservadoras sobre el esquema de `supabase/schema.sql`.
 */
/** Modelo de IA por defecto (todas las llamadas pasan por `lib/openai.ts`). */
export const DEFAULT_AI_MODEL = 'gpt-4o-mini';

/**
 * Precio público del proveedor de IA (USD por 1M tokens) para ESTIMAR el coste
 * en el panel interno y vigilar el margen de cada plan. No sustituye a la
 * factura de OpenAI. `lib/openai.ts` usa la misma tabla.
 */
export const AI_MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2, output: 8 },
};

/** Precio de referencia del modelo (USD por 1M tokens). */
export function aiModelPricing(model: string = DEFAULT_AI_MODEL) {
  return AI_MODEL_PRICING[model] ?? AI_MODEL_PRICING[DEFAULT_AI_MODEL];
}

/** Coste estimado en USD de una llamada de IA (redondeado a 6 decimales). */
export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  model: string = DEFAULT_AI_MODEL,
): number {
  const price = aiModelPricing(model);
  const usd = (promptTokens / 1_000_000) * price.input + (completionTokens / 1_000_000) * price.output;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export const ROW_KB = {
  /** 1 fila de `reviews` (texto + respuesta + índices). */
  review: 6,
  /** 1 fila de `quota_events` (ledger/auditoría de consumo). */
  audit: 0.4,
  /** 1 fila de `integrations` (credenciales OAuth en jsonb). */
  integration: 2,
  /** 1 fila de `ai_interactions` (tokens, modelo, latencia y estado). */
  aiInteraction: 1.2,
} as const;

export type PlanFeatures = {
  /** Peticiones de opiniones por email. */
  emailRequests: boolean;
  /** Peticiones de opiniones y alertas por WhatsApp. */
  whatsappAlerts: boolean;
  /** Sincronización de opiniones de Google Business Profile (OAuth). */
  googleBusiness: boolean;
  /** Sincronización vía Google Places API (key de servidor). */
  googlePlaces: boolean;
  /** Sincronización de Trustpilot Business API. */
  trustpilot: boolean;
  /** Sincronización de TripAdvisor (vía SerpAPI/Outscraper). */
  tripadvisor: boolean;
  /** Flujo Neutral de Valoración (/valorar/[slug]). */
  feedbackFunnel: boolean;
  /** Borradores de respuesta con IA (OpenAI o plantilla local). */
  aiReplies: boolean;
  /** Triaje privado de quejas ≤3★ + inspección IA de la reclamación. */
  privateFilter: boolean;
  /** Publicación de la respuesta directamente en Google. */
  publishToGoogle: boolean;
  /** Enlaces «déjanos una opinión» de Google Maps por Place ID. */
  mapsLinks: boolean;
  /** Conexión con tienda (Shopify / WooCommerce / TPV genérico). */
  storeIntegration: boolean;
  /** WhatsApp automático al cliente cuando el pedido se entrega. */
  whatsappOrders: boolean;
  /** API pública de ingesta con la api_key de la empresa. */
  publicApi: boolean;
  /** Nivel de soporte comercial. */
  support: 'comunidad' | 'email' | 'prioritario';
};

/** Límites simples: 4 cuotas mensuales + 4 topes de base de datos. */
export type PlanLimits = {
  /** Peticiones de opiniones enviadas (email + WhatsApp) por ciclo. */
  requestsPerMonth: number;
  /** Opiniones importadas/creadas por ciclo. */
  reviewsPerMonth: number;
  /** Respuestas generadas con IA por ciclo (créditos facturables). */
  aiRepliesPerMonth: number;
  /**
   * Presupuesto de TOKENS de IA por ciclo (entrada + salida).
   * Es el freno de coste real: aunque queden créditos de IA, si se agota el
   * presupuesto de tokens la API responde 429 hasta el siguiente ciclo.
   * Dimensionado para cubrir con holgura las respuestas del plan usando
   * `gpt-4o-mini` (~470 tokens por borrador ≈ 0,00003 $).
   */
  aiTokensPerMonth: number;
  /** Sincronizaciones automáticas con Google/Trustpilot por ciclo. */
  syncsPerMonth: number;
  /** Empresas (tenants) incluidas. */
  tenants: number;
  /** Sedes / tiendas incluidas. */
  locations: number;

  /* ----- Topes de base de datos (por empresa) ----- */
  /** Máximo de opiniones retenidas en `reviews` (purga automática del resto). */
  reviewsStored: number;
  /** Máximo de registros de auditoría en `quota_events` por empresa. */
  auditRows: number;
  /** Máximo de conexiones simultáneas en `integrations`. */
  integrations: number;
  /** Máximo de filas de interacciones de IA retenidas (`ai_interactions`). */
  aiRows: number;
  /** Días de historial de actividad por empresa (`quota_events`) antes de podarse. */
  logRetentionDays: number;
  /** Cuota de almacenamiento activo asignada en la instancia (MB). */
  storageMb: number;
};

export type PlanDefinition = {
  id: PlanId;
  /** Track comercial: 'local' (sin tienda) | 'commerce' (pedidos + WhatsApp al entregar). */
  track: 'local' | 'commerce';
  /** Nombre interno (BD/Stripe). */
  label: string;
  /** Nombre comercial. */
  name: string;
  /** Alias corto de marketing. */
  tier: string;
  /** Precio formateado («29 €»). */
  price: string;
  /** Precio en céntimos (EUR). */
  priceCents: number;
  /** Frase comercial de una línea. */
  pitch: string;
  /** Límites mensuales + topes de base de datos. */
  limits: PlanLimits;
  features: PlanFeatures;
};

const SUPPORT_FULL: PlanFeatures = {
  emailRequests: true,
  whatsappAlerts: true,
  googleBusiness: true,
  googlePlaces: true,
  trustpilot: true,
  tripadvisor: true,
  feedbackFunnel: true,
  aiReplies: true,
  privateFilter: true,
  publishToGoogle: true,
  mapsLinks: true,
  storeIntegration: true,
  whatsappOrders: true,
  publicApi: true,
  support: 'prioritario',
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  /* ------------------------------ NEGOCIO ------------------------------ */
  negocio: {
    id: 'negocio',
    label: 'Negocio',
    name: 'Negocio',
    tier: 'Negocio',
    track: 'local',
    price: '19 €',
    priceCents: 1900,
    pitch:
      'Para bares, clínicas, salones y todo negocio de mostrador: reseñas de Google/TripAdvisor/Trustpilot en una bandeja e IA que responde como tú.',
    limits: {
      requestsPerMonth: 400,
      reviewsPerMonth: 800,
      aiRepliesPerMonth: 200,
      aiTokensPerMonth: 150_000,
      syncsPerMonth: 60,
      tenants: 1,
      locations: 1,
      reviewsStored: 3_000,
      auditRows: 8_000,
      integrations: 4,
      aiRows: 15_000,
      logRetentionDays: 120,
      storageMb: 1_024,
    },
    features: {
      ...SUPPORT_FULL,
      storeIntegration: false,
      whatsappOrders: false,
      support: 'comunidad',
    },
  },

  /* --------------------------- NEGOCIO PLUS ---------------------------- */
  negocio_plus: {
    id: 'negocio_plus',
    label: 'Negocio Plus',
    name: 'Negocio Plus',
    tier: 'Negocio Plus',
    track: 'local',
    price: '39 €',
    priceCents: 3900,
    pitch:
      'Todo lo de Negocio con límites ×3, varias sedes y sincronización cada 3 h. Para locales con mucho trajín o varios establecimientos.',
    limits: {
      requestsPerMonth: 1_200,
      reviewsPerMonth: 2_500,
      aiRepliesPerMonth: 700,
      aiTokensPerMonth: 600_000,
      syncsPerMonth: 360,
      tenants: 1,
      locations: 5,
      reviewsStored: 10_000,
      auditRows: 20_000,
      integrations: 8,
      aiRows: 40_000,
      logRetentionDays: 240,
      storageMb: 4_096,
    },
    features: {
      ...SUPPORT_FULL,
      storeIntegration: false,
      whatsappOrders: false,
      support: 'email',
    },
  },

  /* ------------------------------- TIENDAS ------------------------------ */
  tiendas: {
    id: 'tiendas',
    label: 'Tiendas',
    name: 'Tiendas',
    tier: 'Tiendas',
    track: 'commerce',
    price: '49 €',
    priceCents: 4900,
    pitch:
      'Para e-commerce y dropshipping: todo lo de Negocio Plus más conexión con Shopify/Woo/TPV y WhatsApp automático cuando el paquete se entrega.',
    limits: {
      requestsPerMonth: 2_000,
      reviewsPerMonth: 5_000,
      aiRepliesPerMonth: 1_500,
      aiTokensPerMonth: 1_200_000,
      syncsPerMonth: 720,
      tenants: 1,
      locations: 10,
      reviewsStored: 25_000,
      auditRows: 50_000,
      integrations: 20,
      aiRows: 100_000,
      logRetentionDays: 365,
      storageMb: 10_240,
    },
    features: { ...SUPPORT_FULL, support: 'email' },
  },

  /* ---------------------------- TIENDAS PLUS ---------------------------- */
  tiendas_plus: {
    id: 'tiendas_plus',
    label: 'Tiendas Plus',
    name: 'Tiendas Plus',
    tier: 'Tiendas Plus',
    track: 'commerce',
    price: '89 €',
    priceCents: 8900,
    pitch:
      'El plan de volumen: límites ×3 sobre Tiendas, sincronización cada 30 min, 30 sedes, API de ingesta y soporte prioritario.',
    limits: {
      requestsPerMonth: 6_000,
      reviewsPerMonth: 15_000,
      aiRepliesPerMonth: 4_000,
      aiTokensPerMonth: 3_000_000,
      syncsPerMonth: 2_160,
      tenants: 1,
      locations: 30,
      reviewsStored: 100_000,
      auditRows: 150_000,
      integrations: 40,
      aiRows: 300_000,
      logRetentionDays: 730,
      storageMb: 25_600,
    },
    features: { ...SUPPORT_FULL, support: 'prioritario' },
  },
};

/** Lista ordenada para pintar en la tabla de precios pública (solo planes de pago). */
export const PLAN_CATALOG: PlanDefinition[] = [PLANS.negocio, PLANS.negocio_plus, PLANS.tiendas, PLANS.tiendas_plus];


/**
 * Compatibilidad hacia atrás: estructura plana de límites usada por código
 * antiguo (`PLAN_LIMITS[plan].eventsPerMonth`). `eventsPerMonth` es ahora la
 * suma de las 4 cuotas mensuales, solo informativo.
 */
export const PLAN_LIMITS: Record<
  PlanId,
  { tenants: number; eventsPerMonth: number; label: string; price: string }
> = Object.fromEntries(
  PLAN_CATALOG.map((p) => [
    p.id,
    {
      tenants: p.limits.tenants,
      eventsPerMonth:
        p.limits.requestsPerMonth + p.limits.reviewsPerMonth + p.limits.aiRepliesPerMonth + p.limits.syncsPerMonth,
      label: p.label,
      price: p.price,
    },
  ]),
) as Record<PlanId, { tenants: number; eventsPerMonth: number; label: string; price: string }>;

/**
 * Normaliza cualquier string de BD a un PlanId válido (defensivo).
 * NO existe plan gratuito: cualquier valor desconocido o legacy de tipo
 * gratuito (`free`, `trial`, `gratis`) resuelve al plan de pago más barato
 * (`pro`) para que el acceso exija siempre una suscripción de pago.
 */
export function resolvePlan(plan: string | null | undefined): PlanId {
  const value = (plan ?? '').trim().toLowerCase();
  if (value === 'negocio' || value === 'negocio_plus' || value === 'tiendas' || value === 'tiendas_plus')
    return value;
  // Retrocompatibilidad con los ids del catálogo anterior (2 planes) y legacy.
  if (value === 'business' || value === 'completo' || value === 'completo-ecommerce' || value === 'ecommerce' || value === 'enterprise')
    return 'tiendas';
  // `pro`, `free`, `trial`, `gratis`, `starter`, `standard`, `resenas` y
  // cualquier otro valor → plan de pago más barato del track local.
  return 'negocio';
}

/** Plan inmediato superior para los mensajes de mejora (upsell honesto). */
export function nextPlanFor(plan: string | null | undefined): PlanDefinition | null {
  const idx = PLAN_CATALOG.findIndex((p) => p.id === resolvePlan(plan));
  if (idx === -1 || idx === PLAN_CATALOG.length - 1) return null;
  return PLAN_CATALOG[idx + 1];
}

export function planOf(plan: string | null | undefined): PlanDefinition {
  return PLANS[resolvePlan(plan)];
}

/** Todos los planes del catálogo son de pago (se mantiene por compatibilidad). */
export function isPaidPlan(_plan: string | null | undefined): _plan is PlanId {
  return true;
}

/** ¿El plan habilita esta feature? */
export function planHasFeature(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  return Boolean(planOf(plan).features[feature]);
}

/** ¿La suscripción da acceso al panel? (trialing/active y no suspendida) */
export function hasAccess(status: string, suspended: boolean): boolean {
  if (suspended) return false;
  return status === 'active' || status === 'trialing';
}

/** ¿La prueba ha caducado? (día 8 sin pago → corte de acceso) */
export function isTrialExpired(
  status: string,
  trialEndsAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (status !== 'trialing' || !trialEndsAt) return false;
  const end = new Date(trialEndsAt).getTime();
  return Number.isFinite(end) && end <= now.getTime();
}

/* ------------------------------------------------------------------ */
/* Ciclos de facturación                                               */
/* ------------------------------------------------------------------ */

/** Ciclo de facturación actual: YYYY-MM. */
export function currentCycle(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Primer instante del ciclo siguiente (renovación de cuota). */
export function nextCycleStart(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

/** Etiqueta legible de la renovación: «1 de octubre de 2026». */
export function renewalLabel(d = new Date()): string {
  return nextCycleStart(d).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Segundos hasta la renovación (para la cabecera `Retry-After` del 429). */
export function secondsUntilRenewal(d = new Date()): number {
  return Math.max(60, Math.round((nextCycleStart(d).getTime() - d.getTime()) / 1000));
}

/* ------------------------------------------------------------------ */
/* Ampliaciones puntuales (add-ons)                                    */
/* ------------------------------------------------------------------ */

/**
 * Modelo simplificado: SOLO recargas de pago único que suman capacidad al
 * ciclo en curso (una por métrica). Sin cuotas ilimitadas ni suscripciones
 * paralelas: menos casos límite, menos sobrecostes.
 */
export type AddonPackId = 'extra_requests_1000' | 'extra_reviews_2000' | 'extra_ai_500' | 'extra_syncs_500';

export type AddonPack = {
  id: AddonPackId;
  /** Nombre comercial corto. */
  name: string;
  /** Descripción para el Checkout y la tabla de precios. */
  description: string;
  /** Precio en céntimos (EUR). */
  priceCents: number;
  /** Variable de entorno con el Price ID de Stripe (si se prefiere catálogo). */
  priceEnv: string;
  /** Etiqueta de marketing opcional («Más vendido»). */
  badge?: string;
  /** Métrica que amplía. */
  metric: UsageMetric;
  /** Capacidad añadida al ciclo en curso. */
  amount: number;
};

export const ADDON_PACKS: Record<AddonPackId, AddonPack> = {
  extra_requests_1000: {
    id: 'extra_requests_1000',
    name: '+1.000 peticiones',
    description: '1.000 peticiones de opiniones más (email y WhatsApp) para este ciclo.',
    priceCents: Number(process.env.STRIPE_ADDON_REQUESTS_PRICE_CENTS ?? '900'),
    priceEnv: 'STRIPE_PRICE_ADDON_REQUESTS',
    badge: 'Más vendido',
    metric: 'requests',
    amount: 1_000,
  },
  extra_reviews_2000: {
    id: 'extra_reviews_2000',
    name: '+2.000 opiniones',
    description: '2.000 opiniones más este ciclo y 2.000 plazas extra de almacenamiento.',
    priceCents: Number(process.env.STRIPE_ADDON_REVIEWS_PRICE_CENTS ?? '1200'),
    priceEnv: 'STRIPE_PRICE_ADDON_REVIEWS',
    metric: 'reviews',
    amount: 2_000,
  },
  extra_ai_500: {
    id: 'extra_ai_500',
    name: '+500 respuestas IA',
    description: '500 borradores de IA adicionales (respuestas públicas y mensajes privados).',
    priceCents: Number(process.env.STRIPE_ADDON_AI_PRICE_CENTS ?? '1500'),
    priceEnv: 'STRIPE_PRICE_ADDON_AI',
    metric: 'ai',
    amount: 500,
  },
  extra_syncs_500: {
    id: 'extra_syncs_500',
    name: '+500 sincronizaciones',
    description: '500 sincronizaciones automáticas más (Google Business, Places y Trustpilot).',
    priceCents: Number(process.env.STRIPE_ADDON_SYNCS_PRICE_CENTS ?? '600'),
    priceEnv: 'STRIPE_PRICE_ADDON_SYNCS',
    metric: 'syncs',
    amount: 500,
  },
};

/** Catálogo de ampliaciones (todas de pago único, se consumen en el ciclo). */
export const ADDON_CATALOG: AddonPack[] = Object.values(ADDON_PACKS);

/** Compat: catálogo recurrente vacío (el modelo ya no tiene suscripciones extra). */
export const ADDON_RECURRING_CATALOG: AddonPack[] = [];

/** Catálogo completo (una sola familia). */
export const ALL_ADDON_CATALOG: AddonPack[] = ADDON_CATALOG;

export function resolveAddonPack(id: string | null | undefined): AddonPack | null {
  if (!id) return null;
  const key = id.trim().toLowerCase() as AddonPackId;
  return ADDON_PACKS[key] ?? null;
}

/** Compat: todas las ampliaciones son de pago único. */
export function addonIsRecurring(_id: string | null | undefined): boolean {
  return false;
}

/** Etiqueta de cobro para la UI: «pago único · 9 €». */
export function addonBillingLabel(pack: Pick<AddonPack, 'priceCents'>): string {
  return `pago único · ${formatEur(pack.priceCents)}`;
}

export function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2).replace('.', ',')} €`;
}

/* ------------------------------------------------------------------ */
/* Almacenamiento activo                                               */
/* ------------------------------------------------------------------ */

export type StorageUsageInput = {
  reviewsStored: number;
  auditRows: number;
  integrations: number;
  /** Filas de `ai_interactions` retenidas (contabilidad de tokens). */
  aiRows?: number;
};

/** Estimación de MB activos de una empresa a partir de sus filas reales. */
export function estimateStorageMb(input: StorageUsageInput): number {
  const kb =
    input.reviewsStored * ROW_KB.review +
    input.auditRows * ROW_KB.audit +
    input.integrations * ROW_KB.integration +
    (input.aiRows ?? 0) * ROW_KB.aiInteraction;
  return Math.max(0, Math.round((kb / 1024) * 10) / 10);
}

