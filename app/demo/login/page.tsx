import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { demoEnvironmentEnabled, DEMO_COOKIE_NAME, verifyDemoToken } from '@/lib/demo-mode';
import { DemoLoginForm } from './demo-login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Entorno de pruebas · ReviewFlow AI',
  robots: { index: false, follow: false },
};

/**
 * Acceso al entorno de pruebas comercial (v3.14.0).
 *
 * No se enlaza desde ninguna página pública y responde 404 si el operador no
 * ha definido `DEMO_ACCESS_CODE` en el servidor: no hay puerta trasera fija,
 * ni cuentas, ni datos reales — solo el panel simulado y con caducidad.
 */
export default async function DemoLoginPage() {
  if (!demoEnvironmentEnabled()) notFound();

  // Si ya hay acceso vigente, entra directamente.
  const store = await cookies();
  const token = store.get(DEMO_COOKIE_NAME)?.value;
  if (await verifyDemoToken(token)) redirect('/demo/business');

  return <DemoLoginForm />;
}
