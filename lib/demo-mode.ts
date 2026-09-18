/**
 * Entorno de pruebas seguro para PREVENTA (v3.14.0).
 *
 * Permite que el dueño del proyecto invite a un potencial cliente a ver el
 * panel tal y como lo verá un suscriptor (plan Pro o Business), SIN crear
 * cuentas reales y SIN exponer ningún acceso permanente:
 *
 *   1. El acceso se activa SOLO si la variable de servidor `DEMO_ACCESS_CODE`
 *      está definida (nunca se guarda ningún código en el repositorio).
 *   2. El visitante introduce el código en `/demo/login` → recibe una cookie
 *      httpOnly firmada (HMAC-SHA256) con caducidad corta (8 h por defecto).
 *   3. Cada request se re-verifica de forma timing-safe y con expiración.
 *   4. `/demo` responde 404 si el entorno está desactivado, y el panel solo
 *      muestra datos SIMULADOS: no toca la base de datos ni las APIs reales.
 *
 * Runtime: usa únicamente Web Crypto, por lo que funciona igual en Node
 * (route handlers y server components) y en el edge runtime del proxy.
 */

export const DEMO_COOKIE_NAME = 'rf_demo_preview';
export const DEMO_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 h

const encoder = new TextEncoder();

function demoAccessCode(): string {
  return (process.env.DEMO_ACCESS_CODE ?? '').trim();
}

/** El entorno de pruebas existe solo si el operador define el código. */
export function demoEnvironmentEnabled(): boolean {
  return demoAccessCode().length >= 8;
}

function signingSecret(): string {
  return (
    process.env.APP_SIGNING_SECRET ||
    process.env.OAUTH_STATE_SECRET ||
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'reviewflow-local-development-secret'
  );
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparación en tiempo constante (evita cronometrar el hash). */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Comprueba el código introducido frente al del servidor (hash + ct-compare). */
export async function verifyDemoAccessCode(candidate: string | null | undefined): Promise<boolean> {
  const real = demoAccessCode();
  if (!real || !candidate) return false;
  const [a, b] = await Promise.all([hmacHex(`demo-code:${candidate}`), hmacHex(`demo-code:${real}`)]);
  return constantTimeEquals(a, b);
}

/** Genera el valor de la cookie: `<exp毫秒>.<hmac>` (8 h, sin sesión real). */
export async function issueDemoToken(): Promise<string> {
  const exp = Date.now() + DEMO_COOKIE_MAX_AGE_SECONDS * 1000;
  const sig = await hmacHex(`demo-token:${exp}`);
  return `${exp}.${sig}`;
}

export async function verifyDemoToken(raw: string | undefined | null): Promise<boolean> {
  if (!raw) return false;
  const [expStr, sig] = raw.split('.');
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  // Si el operador retira el código, las cookies vigentes dejan de servir:
  // cambia APP_SIGNING_SECRET (o retírala en desarrollo) para invalidar ya.
  if (!demoEnvironmentEnabled()) return false;
  const expected = await hmacHex(`demo-token:${exp}`);
  return constantTimeEquals(expected, sig);
}

/** Valida la petición entrante por cookie (para server components / routes). */
export async function demoRequestAllowed(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${DEMO_COOKIE_NAME}=`));
  if (!match) return false;
  return verifyDemoToken(match.slice(DEMO_COOKIE_NAME.length + 1));
}
