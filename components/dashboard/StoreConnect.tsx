'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Store,
  TriangleAlert,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/Skeleton';
import { HelpTip } from '@/components/HelpTip';
import { Accordion } from '@/components/Accordion';
import { EASE } from '@/components/Motion';
import { describeApiError, type TenantInfo } from '@/components/dashboard/types';
import { planHasFeature } from '@/lib/plans';

/**
 * Conexión con la tienda (plan Business) — v3.14.0: 1 clic asistido.
 *
 * El cliente solo pulsa «Conectar cuenta»; la parte técnica (webhooks,
 * secretos HMAC, permisos de API) se configura desde el panel privado /admin
 * y queda totalmente oculta. Al entregarse un pedido, el cliente recibe un
 * WhatsApp pidiendo su valoración, automáticamente.
 */

const PROVIDERS = [
  { id: 'shopify', name: 'Shopify', desc: 'Tu tienda de Shopify se conecta sola: nosotros activamos los avisos de entrega.', icon: '🛍️' },
  { id: 'woocommerce', name: 'WooCommerce', desc: 'Tu tienda WordPress: activamos el aviso automático cuando un pedido se entrega.', icon: '🧩' },
  { id: 'store', name: 'Otro (TPV, a medida…)', desc: '¿Usas otro sistema? Dinos cuál y lo conectamos contigo por teléfono o email.', icon: '🏪' },
] as const;

type ProviderId = (typeof PROVIDERS)[number]['id'];

export function StoreConnect({
  tenant: t,
  demo,
  preview = false,
}: {
  tenant: TenantInfo;
  demo: boolean;
  /** Entorno de pruebas: la conexión se simula en local (sin APIs). */
  preview?: boolean;
}) {
  const toast = useToast();
  const [provider, setProvider] = useState<ProviderId>('shopify');
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);

  const storeInteg = t.integrations.find((i) => ['shopify', 'woocommerce', 'store'].includes(i.provider));
  const canUseStore = planHasFeature(t.plan, 'storeIntegration');

  if (!canUseStore) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-sm text-amber-100">
        <p className="flex items-start gap-2">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          <span>
            La conexión con tu tienda (Shopify, WooCommerce o TPV) y el WhatsApp al entregar están
            incluidos en el plan <strong className="text-white">Business</strong>.{' '}
            <Link href="/bienvenido?plan=business" className="font-semibold underline underline-offset-2">
              Cambiar de plan
            </Link>
            .
          </span>
        </p>
      </div>
    );
  }

  async function connect() {
    if (preview || demo) {
      setRequested(true);
      toast({
        kind: 'success',
        title: 'Conexión solicitada (vista de pruebas)',
        body: 'En el panel real, nuestro equipo la completa en unas horas sin que muevas un dedo.',
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/store/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t.id, provider, mode: 'assisted' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body });
        return;
      }
      toast({
        kind: 'success',
        title: 'Tienda conectada',
        body: data.message ?? 'Ya nos encargamos nosotros: te avisamos cuando quede activa.',
        duration: 8000,
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo conectar', body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const connected = storeInteg?.status === 'connected' || (requested && (preview || demo));
  const pending = storeInteg?.status === 'pending_setup';

  if (connected) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-white">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <strong className="font-semibold">
            {PROVIDERS.find((p) => p.id === (storeInteg?.provider ?? provider))?.name ?? 'Tienda'}
          </strong>{' '}
          conectada · WhatsApp al entregar activo
          {storeInteg?.last_sync_at && (
            <span className="text-xs text-ink-400">
              último pedido avisado {new Date(storeInteg.last_sync_at).toLocaleString('es-ES')}
            </span>
          )}
        </p>
        <p className="text-xs leading-relaxed text-ink-400">
          Cuando un pedido pasa a «Entregado», el cliente recibe un WhatsApp con tu enlace de
          valoración. Cada envío usa 1 petición de tu cuota mensual y no hay nada que configurar
          en tu tienda: nosotros nos ocupamos de todo.
        </p>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="space-y-3">
        <p className="flex flex-wrap items-center gap-2 text-sm text-white">
          <Clock size={15} className="animate-pulse text-amber-300" />
          <strong className="font-semibold">Conexión solicitada · pendiente de activación</strong>
          <span className="badge-warn">nos encargamos nosotros</span>
        </p>
        <p className="text-xs leading-relaxed text-ink-400">
          Recibimos tu solicitud. Nuestro equipo está configurando el aviso de pedidos entregados
          con tu plataforma; te avisaremos por email en cuanto funcione solo (normalmente, menos
          de 24 h laborables).
        </p>
        <Accordion
          exclusive
          defaultOpen={null}
          items={[
            {
              id: 'store-instrucciones',
              title: 'Ver instrucción rápida (por si te la piden)',
              icon: <Lightbulb size={15} className="text-amber-300" />,
              content: (
                <p className="text-sm leading-relaxed text-ink-300">
                  Solo podrías necesitar una cosa: <strong className="text-white">aprobar el permiso</strong>{' '}
                  si tu plataforma de tienda (p. ej. Shopify) te envía una confirmación de la app. Es
                  un botón de «Aceptar» y nada más. Si no llega nada, no tienes que hacer nada: te
                  acompañamos durante todo el proceso.
                </p>
              ),
            },
          ]}
          itemClassName="bg-white/[0.02]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <Store size={15} className="text-brand-300" /> Conecta tu tienda
        <HelpTip
          title="Conexión con tu tienda"
          what="Justo cuando un cliente recibe su pedido, le enviamos un WhatsApp amable para pedirle su reseña."
          helps="Pedir la opinión en el mejor momento multiplica las reseñas de 5★ y desvía las quejas a atención privada."
          steps={['Elige tu plataforma', 'Pulsa «Conectar cuenta»', 'El resto lo hacemos nosotros']}
          helpTopic="conexiones"
        />
      </p>
      <p className="text-sm leading-relaxed text-ink-300">
        Elige tu plataforma y pulsa <strong className="text-white">Conectar cuenta</strong>. En 1
        clic queda solicitada: la configuración técnica la hacemos nosotros y no necesitas claves,
        tokens ni saber de programar.
      </p>

      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Plataforma de tu tienda">
        {PROVIDERS.map((p) => {
          const active = provider === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setProvider(p.id)}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              className={`rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                active
                  ? 'border-brand-400/60 bg-brand-500/10'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <span className="text-xl" aria-hidden>{p.icon}</span>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-white">
                {p.name}
                {active && <CheckCircle2 size={13} className="ml-auto text-brand-300" />}
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-400">{p.desc}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={connect} disabled={saving} className="btn-primary">
          {saving ? <Spinner label="Enviando…" /> : (<><ShoppingBag size={15} /> Conectar cuenta</>)}
        </button>
        <span className="inline-flex items-center gap-1.5 text-2xs text-ink-500">
          <ShieldCheck size={12} className="text-emerald-400" /> Sin claves ni contraseñas: todo cifrado por detrás
        </span>
      </div>

      <AnimatePresence>
        {saving && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-brand-200"
          >
            <Loader2 size={13} className="animate-spin" /> Comprobando tu cuenta y preparando la conexión…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
