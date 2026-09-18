import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DEMO_COOKIE_NAME, demoEnvironmentEnabled, verifyDemoToken } from '@/lib/demo-mode';
import { demoFunnelStats, demoReviewsFor, demoTenantFor, demoUsageFor, type DemoPlanId } from '@/lib/demo';
import { DashboardClient } from '@/app/dashboard/dashboard-client';
import { DemoExitButton } from './demo-exit-button';
import { PLAN_CATALOG } from '@/lib/plans';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vista de pruebas del panel · ReviewFlow AI',
  robots: { index: false, follow: false },
};

/**
 * Panel de cliente simulado para preventas — v3.14.0.
 *
 * · Solo accesible con la cookie firmada emitida en /demo/login (código del
 *   servidor; caduca a las 8 h).
 * · Renderiza el MISMO DashboardClient que ve un cliente real, con datos de
 *   ejemplo del plan elegido (Pro o Business), cuotas simuladas y acciones
 *   auto-contenidas (no llaman a la API ni tocan la BD).
 * · Sin indexación, sin enlaces públicos y desactivado por completo si el
 *   operador no define DEMO_ACCESS_CODE.
 */
export default async function DemoPanelPage({ params }: { params: Promise<{ plan: string }> }) {
  if (!demoEnvironmentEnabled()) notFound();

  const { plan: rawPlan } = await params;
  const plan: DemoPlanId | null = rawPlan === 'pro' || rawPlan === 'business' ? rawPlan : null;
  if (!plan) notFound();

  const store = await cookies();
  const token = store.get(DEMO_COOKIE_NAME)?.value;
  const allowed = await verifyDemoToken(token);
  if (!allowed) redirect('/demo/login');

  const tenant = demoTenantFor(plan);
  const reviews = demoReviewsFor(plan);
  const usage = demoUsageFor(plan);
  const funnel = demoFunnelStats();

  return (
    <div className="relative">
      {/* Franja de identidad del entorno: siempre visible, imposible de confundir con el SaaS real */}
      <div className="sticky top-0 z-[60] border-b border-violet-400/25 bg-violet-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs text-violet-100">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Star size={12} className="fill-amber-300 text-amber-300" /> Vista de pruebas
          </span>
          <span className="hidden text-violet-300/70 sm:inline">
            datos simulados · acceso caduca a las 8 h · nada de esto se cobra ni se guarda
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-0.5">
            {PLAN_CATALOG.map((p) => (
              <Link
                key={p.id}
                href={`/demo/${p.id}`}
                aria-current={p.id === plan ? 'page' : undefined}
                className={cn(
                  'rounded-full px-2.5 py-1 font-semibold transition-colors duration-200',
                  p.id === plan ? 'bg-[linear-gradient(120deg,#2563eb,#8b5cf6)] text-white' : 'text-violet-200 hover:text-white',
                )}
              >
                Plan {p.name}
              </Link>
            ))}
          </span>
          <DemoExitButton />
        </div>
      </div>

      <DashboardClient
        tenants={[tenant]}
        reviews={reviews}
        demo
        demoEnv
        previewUsage={usage}
        previewStats={funnel}
        userEmail="invitado@vista-de-pruebas"
        hasAccess
        hasAnyTenant
      />
    </div>
  );
}
