import Stripe from 'stripe';
import { env, isStripeConfigured } from '@/lib/env';
import { ADDON_PACKS, PLAN_CATALOG, type AddonPack, type AddonPackId, type PlanDefinition, type PlanId } from '@/lib/plans';

// Las reglas comerciales viven únicamente en `lib/plans.ts`.

let cached: Stripe | null = null;

/** Instancia Stripe perezosa. null si no hay clave (modo demo). */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!cached) {
    cached = new Stripe(env.stripeSecretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return cached;
}

/**
 * Planes de pago (todos pasan por Stripe con prueba de 7 días; no hay plan gratuito).
 * `priceEnv` documenta la variable de entorno recomendada en `.env.example`.
 */
/**
 * Planes de pago (todos pasan por Stripe con prueba de {TRIAL_DAYS} días; no hay
 * plan gratuito). La lista se DERIVA del catálogo de `lib/plans.ts` para que el
 * checkout, la bienvenida y la landing nunca se desincronicen.
 */
export const STRIPE_PLANS = PLAN_CATALOG.map((p) => ({
  id: p.id,
  name: p.name,
  tier: p.tier,
  track: p.track,
  priceEnv: `STRIPE_PRICE_${p.id.toUpperCase()}`,
  fallbackPrice: `${p.price}/mes`,
  limits: p.limits,
  features: [
    `${p.limits.locations} ${p.limits.locations === 1 ? 'local' : 'sedes'} · ${p.limits.requestsPerMonth.toLocaleString('es-ES')} peticiones/mes`,
    `${p.limits.reviewsPerMonth.toLocaleString('es-ES')} opiniones y ${p.limits.aiRepliesPerMonth.toLocaleString('es-ES')} respuestas IA/mes`,
    `Sincronización automática ${
      p.limits.syncsPerMonth >= 1440 ? 'cada 30 min' : p.limits.syncsPerMonth >= 720 ? 'cada hora' : p.limits.syncsPerMonth >= 300 ? 'cada 3 h' : 'cada 6 h'
    }`,
    p.features.storeIntegration ? 'Tienda (Shopify/Woo/TPV) + WhatsApp al entregar' : 'Email + WhatsApp, Google, TripAdvisor y Trustpilot',
    p.features.support === 'prioritario' ? 'API pública de ingesta y soporte prioritario' : `Soporte por ${p.features.support}`,
  ],
})) as Array<{
  id: PlanId;
  name: string;
  tier: string;
  track: 'local' | 'commerce';
  priceEnv: string;
  fallbackPrice: string;
  limits: PlanDefinition['limits'];
  features: string[];
}>;

/** Price ID de un plan de pago ('' si falta en el .env). */
const PRICE_BY_PLAN: Record<PlanId, string> = {
  negocio: env.stripePriceNegocio,
  negocio_plus: env.stripePriceNegocioPlus,
  tiendas: env.stripePriceTiendas,
  tiendas_plus: env.stripePriceTiendasPlus,
};

export function priceIdFor(plan: PlanId): string {
  return PRICE_BY_PLAN[plan] ?? '';
}

const ADDON_PRICE_ENV: Record<AddonPackId, string> = {
  extra_requests_1000: env.stripePriceAddonRequests,
  extra_reviews_2000: env.stripePriceAddonReviews,
  extra_ai_500: env.stripePriceAddonAi,
  extra_syncs_500: env.stripePriceAddonSyncs,
};

/**
 * Price ID configurado para una ampliación ('' si no existe en el .env).
 * Cuando está vacío, `/api/stripe/addon` crea la línea con `price_data`
 * inline usando el importe definido en `lib/plans.ts`.
 */
export function addonPriceIdFor(pack: AddonPackId): string {
  return ADDON_PRICE_ENV[pack] ?? '';
}

/** Line item listo para `checkout.sessions.create` (catálogo o inline). */
export function addonLineItem(pack: AddonPack, quantity = 1): Stripe.Checkout.SessionCreateParams.LineItem {
  const price = addonPriceIdFor(pack.id);
  if (price) return { price, quantity };
  return {
    quantity,
    price_data: {
      currency: 'eur',
      unit_amount: pack.priceCents,
      product_data: {
        name: pack.name,
        description: pack.description,
        metadata: { addon: pack.id },
      },
    },
  };
}

/** ¿Este Price ID corresponde a una ampliación (y a cuál)? */
export function addonPackFromPriceId(priceId?: string | null): AddonPack | null {
  if (!priceId) return null;
  const entry = (Object.entries(ADDON_PRICE_ENV) as Array<[AddonPackId, string]>).find(
    ([, v]) => v && v === priceId,
  );
  return entry ? ADDON_PACKS[entry[0]] : null;
}

/** ¿Este Price ID corresponde a un plan de pago (y a cuál)? */
export function planFromPriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  const entry = (Object.entries(PRICE_BY_PLAN) as Array<[PlanId, string]>).find(([, v]) => v && v === priceId);
  return entry ? entry[0] : null;
}
