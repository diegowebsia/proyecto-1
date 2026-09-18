import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DEMO_COOKIE_MAX_AGE_SECONDS,
  DEMO_COOKIE_NAME,
  demoEnvironmentEnabled,
  issueDemoToken,
  verifyDemoAccessCode,
  verifyDemoToken,
} from '@/lib/demo-mode';
import { consumeRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/security';
import { payloadErrorResponse, readJsonLimited } from '@/lib/request';

export const dynamic = 'force-dynamic';

/**
 * API del entorno de pruebas (venta): canjea el código de acceso por una
 * cookie httpOnly firmada de caducidad corta. Sin código, sin sesión real y
 * sin datos del cliente: el entorno de pruebas solo muestra datos simulados.
 *
 * Seguridad:
 *  · La ruta responde 404 si el operador no ha activado el entorno.
 *  · Rate limit por IP (8 intentos / 15 min) — falla cerrada en producción.
 *  · Comparación del código con HMAC + tiempo constante (nunca en claro).
 *  · La cookie es httpOnly + sameSite=lax + secure en producción.
 */

const Body = z.object({ code: z.string().min(1).max(128) });

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE_SECONDS,
  };
}

export async function GET(req: Request) {
  if (!demoEnvironmentEnabled()) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const cookie = req.headers.get('cookie') ?? '';
  const raw = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${DEMO_COOKIE_NAME}=`))
    ?.slice(DEMO_COOKIE_NAME.length + 1);
  const active = await verifyDemoToken(raw);
  return NextResponse.json({ enabled: true, active, expiresIn: active ? DEMO_COOKIE_MAX_AGE_SECONDS : 0 });
}

export async function POST(req: Request) {
  if (!demoEnvironmentEnabled()) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const ip = requestIp(req);
  const limit = await consumeRateLimit('demo_access', ip, 8, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let input: unknown;
  try {
    input = await readJsonLimited(req, 2048);
  } catch (error) {
    return payloadErrorResponse(error) ?? NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const parsed = Body.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: 'Introduce el código de acceso.' }, { status: 400 });

  const ok = await verifyDemoAccessCode(parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: 'El código de acceso no es válido.' }, { status: 401 });
  }

  const token = await issueDemoToken();
  const res = NextResponse.json({ ok: true, redirect: '/demo/business' });
  res.cookies.set(DEMO_COOKIE_NAME, token, cookieOptions(process.env.NODE_ENV === 'production'));
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE_NAME, '', { ...cookieOptions(process.env.NODE_ENV === 'production'), maxAge: 0 });
  void req;
  return res;
}
