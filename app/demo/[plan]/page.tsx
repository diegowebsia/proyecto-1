import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Sparkles } from 'lucide-react';
import {
  demoFunnelStats,
  demoReviewsFor,
  demoTenantFor,
  demoUsageFor,
  type DemoPlanId,
} from '@/lib/demo';
import { DashboardClient } from '@/app/dashboard/dashboard-client';
import { PLAN_CATALOG, PLANS, resolvePlan } from '@/lib/plans';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Demo del panel · ReviewFlow AI',
  robots: { index: false, follow: false },
};

/**
 * Demo pública del panel por plan — `/demo/{negocio,negocio_plus,tiendas,tiendas_plus}`.
 *
 * · Renderiza el MISMO DashboardClient que ve un cliente suscrito, con los
 *   datos simulados del plan elegido (cuotas, embudo y reseñas de ejemplo).
 * · Las acciones se simulan en local: no llaman a ninguna API ni tocan la BD,
 *   no se guarda ni se cobra nada.
 * · `noindex`: no es una página de captación, solo una visita al producto.
 */
export default async function DemoPanelPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: rawPlan } = await params;
  // Alias legacy (`/demo/pro`, `/demo/business`…) redirigen al plan equivalente.
  if (rawPlan && !(PLAN_CATALOG.map((p) => p.id) as string[]).includes(rawPlan)) {
    const legacy = PLANS[resolvePlan(rawPlan)];
    if (legacy) redirect(`/demo/${legacy.id}`);
  }
  const plan: DemoPlanId | null = (PLAN_CATALOG.map((p) => p.id) as string[]).includes(rawPlan ?? '')
    ? (rawPlan as DemoPlanId)
    : null;
  if (!plan) notFound();

  const tenant = demoTenantFor(plan);
  const reviews = demoReviewsFor(plan);
  const usage = demoUsageFor(plan);
  const funnel = demoFunnelStats();

  return (
    <div>
      {/* Franja de identidad: deja claro que es una demo y permite saltar de plan */}
      <div className="border-b border-amber-400/20 bg-amber-950/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs text-amber-100">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Sparkles size={12} className="text-amber-300" /> Panel demo
          </span>
          <span className="hidden text-amber-200/70 sm:inline">
            datos simulados · no se guarda ni se cobra nada
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-0.5">
            {PLAN_CATALOG.map((p) => (
              <Link
                key={p.id}
                href={`/demo/${p.id}`}
                aria-current={p.id === plan ? 'page' : undefined}
                className={cn(
                  'rounded-full px-2.5 py-1 font-semibold transition-colors duration-200',
                  p.id === plan
                    ? 'bg-[linear-gradient(120deg,#2563eb,#8b5cf6)] text-white'
                    : 'text-amber-200 hover:text-white',
                )}
              >
                Plan {p.name}
              </Link>
            ))}
          </span>
          <Link
            href="/"
            className="flex items-center gap-1 font-semibold text-amber-200 transition-colors hover:text-white"
          >
            <ArrowLeft size={12} /> Volver al inicio
          </Link>
        </div>
      </div>

      <DashboardClient
        tenants={[tenant]}
        reviews={reviews}
        demo
        previewUsage={usage}
        previewStats={funnel}
        userEmail="demo@reviewflow.local"
        hasAccess
        hasAnyTenant
      />
    </div>
  );
}
