'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Link2,
  MapPin,
  Plug,
  RefreshCw,
  Settings2,
  Store,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/Skeleton';
import { Accordion } from '@/components/Accordion';
import { HelpTip } from '@/components/HelpTip';
import { UsagePanel } from '@/components/dashboard/UsagePanel';
import { StoreConnect } from '@/components/dashboard/StoreConnect';
import { EASE } from '@/components/Motion';
import { describeApiError, type TenantInfo } from '@/components/dashboard/types';
import { planHasFeature, planOf } from '@/lib/plans';
import { cn } from '@/lib/utils';

/**
 * Tarjeta de empresa: estado de la suscripción, consumo del ciclo y conexiones.
 *
 * v3.14.0 — cero fricción técnica: Google se conecta con 1 clic (OAuth), y
 * Trustpilot, TripAdvisor y la tienda funcionan con «Conectar cuenta» (modo
 * asistido): la parte técnica la completa el equipo desde /admin. Los campos
 * de API keys y secretos han desaparecido del panel del cliente.
 */
export function TenantCard({
  tenant: t,
  syncing,
  onSync,
  demo,
  preview = false,
  previewUsage = null,
}: {
  tenant: TenantInfo;
  syncing: string | null;
  onSync: (p: 'google' | 'trustpilot' | 'tripadvisor' | 'places', id: string) => void;
  demo: boolean;
  /** Vista demo: las acciones se simulan en local (sin tocar APIs). */
  preview?: boolean;
  /** Snapshot simulado de consumo para la vista demo. */
  previewUsage?: import('@/components/dashboard/types').UsageResponse | null;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState(t.settings.tone ?? 'profesional');
  const [placeId, setPlaceId] = useState(t.settings.place_id ?? '');
  const [waTo, setWaTo] = useState(t.settings.whatsapp_to ?? '');
  const [bizType, setBizType] = useState(t.settings.business_type ?? '');
  const [cEmail, setCEmail] = useState(t.settings.contact_email ?? '');
  const [cPhone, setCPhone] = useState(t.settings.contact_phone ?? '');
  const [cWeb, setCWeb] = useState(t.settings.website ?? '');
  const [taUrl, setTaUrl] = useState('');
  const [tpRequested, setTpRequested] = useState(false);
  const [taRequested, setTaRequested] = useState(false);

  const plan = planOf(t.plan);
  const integ = (p: string) => t.integrations.find((i) => i.provider === p);
  const busy = (key: string) => syncing === key;

  function buyAddon(pack: string) {
    window.location.href = `/dashboard?tab=facturacion&pack=${pack}`;
  }

  async function saveSettings() {
    if (preview) {
      toast({ kind: 'success', title: 'Ajustes guardados (demo)', body: 'Sector, contacto, tono, ficha de Google y móvil actualizados.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/tenants/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: t.id,
          tone,
          place_id: placeId,
          whatsapp_to: waTo || undefined,
          business_type: bizType || undefined,
          contact_email: cEmail || '',
          contact_phone: cPhone || '',
          website: cWeb || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body });
        return;
      }
      toast({ kind: 'success', title: 'Ajustes guardados', body: 'Tu sector, contacto, ficha, tono y móvil quedan actualizados.' });
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo guardar', body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function connectTrustpilot() {
    if (preview || demo) {
      setTpRequested(true);
      toast({
        kind: 'success',
        title: 'Trustpilot solicitado (demo)',
        body: 'En el panel real lo activamos nosotros por ti en menos de 24 h laborables.',
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/trustpilot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t.id, mode: 'assisted' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body });
        return;
      }
      toast({ kind: 'success', title: 'Trustpilot solicitado', body: data.message });
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo conectar', body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function connectTripadvisor() {
    if (!taUrl.trim() && !(preview || demo)) {
      toast({
        kind: 'warning',
        title: 'Pega el enlace de tu ficha',
        body: 'Copia la dirección de tu página en TripAdvisor (contiene un código «d…», nosotros lo sacamos por ti).',
      });
      return;
    }
    if (preview || demo) {
      setTaRequested(true);
      toast({
        kind: 'success',
        title: 'TripAdvisor solicitado (demo)',
        body: 'Nos encargamos de localizar tu ficha y activar la sincronización.',
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/tripadvisor/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t.id, url: taUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body });
        return;
      }
      toast({ kind: 'success', title: 'TripAdvisor conectado', body: data.message });
      setTaUrl('');
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo conectar', body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function testWhatsapp() {
    if (!waTo) {
      toast({ kind: 'warning', title: 'Escribe primero el móvil', body: 'Formato internacional: 34612345678.' });
      return;
    }
    if (preview) {
      toast({ kind: 'success', title: 'Alerta enviada (demo)', body: `Simulación: llegaría al ${waTo} en segundos.` });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t.id, to: waTo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body, action: described.action });
        return;
      }
      toast({ kind: 'success', title: 'WhatsApp enviado', body: data.message });
      window.dispatchEvent(new Event('rf:quota-refresh'));
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo enviar', body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const tpConnected = Boolean(integ('trustpilot')?.status === 'connected') || tpRequested;
  const tpPending = Boolean(integ('trustpilot')?.status === 'pending_setup');
  const taConnected = Boolean(integ('tripadvisor')?.status === 'connected') || taRequested;
  const taPending = Boolean(integ('tripadvisor')?.status === 'pending_setup');

  return (
    <div className={cn('card card-hover', !t.access && 'border-rose-400/25')}>
      {/* Cabecera plegable */}
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-bold tracking-tightish text-white">
              <span className="truncate">{t.name}</span>
              <span className="badge-brand">{plan.tier}</span>
              {!t.access && (
                <span className="badge-danger">
                  <XCircle size={11} /> sin acceso
                </span>
              )}
              {t.subscription_status === 'trialing' && t.trial_ends_at && (
                <span className="badge-brand">
                  prueba hasta {new Date(t.trial_ends_at).toLocaleDateString('es-ES')}
                </span>
              )}
            </span>
            <span className="mt-1 block truncate text-xs text-ink-400">
              {plan.label} · {t.subscription_status === 'trialing' ? 'disfrutando de la prueba gratuita' : 'suscripción activa'}
              {t.integrations.filter((i) => i.status === 'connected').length > 0 &&
                ` · ${t.integrations.filter((i) => i.status === 'connected').length} fuente(s) en marcha`}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-sm text-ink-300">
            <Settings2 size={15} className="hidden sm:block" />
            <span className="hidden sm:inline">Conexiones y ajustes</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10"
            >
              <ChevronDown size={14} />
            </motion.span>
          </span>
        </button>
        <HelpTip
          className="mt-1"
          title="Empresa y conexiones"
          what="Aquí se enlazan tus fuentes de reseñas (Google, Trustpilot, TripAdvisor y tu tienda) y se elige cómo suena tu marca."
          helps="Cuanto antes conectes, antes empiezan a llegar reseñas y alertas: todo funciona solo desde ese momento."
          steps={['Conecta Google con 1 clic', 'Solicita el resto con «Conectar cuenta»', 'Ajusta el tono de la IA y guarda']}
          helpTopic="conexiones"
        />
      </div>

      <div className="mt-4">
        <UsagePanel tenantId={t.id} demo={demo} previewUsage={previewUsage} onBuyAddon={buyAddon} compact />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.36, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-4">
              <Accordion
                exclusive={false}
                defaultOpen={[0]}
                items={[
                  {
                    id: `${t.id}-store`,
                    title: 'Tienda online (Shopify · WooCommerce · TPV)',
                    icon: <Store size={15} />,
                    meta: planHasFeature(t.plan, 'storeIntegration')
                      ? integ('shopify') || integ('woocommerce') || integ('store')
                        ? 'Conectada · WhatsApp al entregar activo'
                        : 'Un clic y nos encargamos nosotros'
                      : 'Propia de los planes Tiendas',
                    content: <StoreConnect tenant={t} demo={demo} preview={preview} />,
                  },
                  {
                    id: `${t.id}-google`,
                    title: 'Google Business Profile',
                    icon: <Plug size={15} />,
                    meta: integ('google')
                      ? `Conectado${integ('google')?.last_sync_at ? ` · sincronizado ${new Date(integ('google')!.last_sync_at!).toLocaleString('es-ES')}` : ''}`
                      : '1 clic: inicias sesión con tu cuenta de empresa',
                    content: (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {!integ('google') ? (
                            preview ? (
                              <button
                                onClick={() => toast({ kind: 'success', title: 'Google conectado (demo)', body: 'En el panel real esto es el inicio de sesión de Google y nada más.' })}
                                className="btn-light btn-sm"
                              >
                                <Link2 size={13} /> Conectar con Google
                              </button>
                            ) : (
                              <a href={`/api/integrations/google/connect?tenantId=${t.id}`} className="btn-light btn-sm">
                                <Link2 size={13} /> Conectar con Google
                              </a>
                            )
                          ) : (
                            <>
                              <span className="badge-ok">
                                <CheckCircle2 size={11} /> conectado
                              </span>
                              <button
                                onClick={() => onSync('google', t.id)}
                                disabled={busy(`google-${t.id}`)}
                                className="btn-secondary btn-sm"
                              >
                                {busy(`google-${t.id}`) ? (
                                  <Spinner label="Sincronizando…" size={13} />
                                ) : (
                                  <>
                                    <RefreshCw size={13} /> Sincronizar reseñas
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-ink-400">
                          Es el mismo inicio de sesión de siempre en Google: no compartes ninguna
                          contraseña con nosotros, solo autorizas leer tus reseñas y publicar tus
                          respuestas. Cada sincronización importa tus reseñas reales y descuenta 1
                          de tu límite mensual de {plan.limits.syncsPerMonth}.
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: `${t.id}-places`,
                    title: 'Ficha de Google Maps (para pedir reseñas)',
                    icon: <MapPin size={15} />,
                    meta: placeId ? 'Ficha enlazada · enlace «déjanos una reseña» activo' : 'Pega el enlace de tu ficha y listo',
                    content: (
                      <div className="space-y-3">
                        <div>
                          <label className="label" htmlFor={`${t.id}-place`}>
                            Enlace de tu ficha en Google Maps
                          </label>
                          <input
                            id={`${t.id}-place`}
                            className="input"
                            placeholder="https://maps.google.com/?cid=… o «Compartir → Copiar enlace»"
                            value={placeId}
                            onChange={(e) => setPlaceId(e.target.value)}
                          />
                          <p className="hint">
                            Búscate en Google Maps, pulsa «Compartir → Copiar enlace» y pégalo aquí.
                            Nos ocupamos del resto: con él generamos tu enlace directo para que te
                            dejen reseñas.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onSync('places', t.id)}
                            disabled={busy(`places-${t.id}`) || !placeId || preview}
                            className="btn-secondary btn-sm"
                          >
                            {busy(`places-${t.id}`) ? (
                              <Spinner label="Sincronizando…" size={13} />
                            ) : (
                              <>
                                <RefreshCw size={13} /> Importar reseñas de esta ficha
                              </>
                            )}
                          </button>
                          <button onClick={saveSettings} disabled={saving} className="btn-primary btn-sm">
                            {saving ? <Spinner label="Guardando…" size={13} /> : 'Guardar ficha'}
                          </button>
                          {placeId && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeId)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-quiet btn-sm"
                            >
                              Ver mi ficha ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: `${t.id}-trustpilot`,
                    title: 'Trustpilot Business',
                    icon: <Store size={15} />,
                    meta: tpConnected
                      ? 'Conectado · sincroniza solo'
                      : tpPending
                        ? 'Pendiente de activación'
                        : 'Lo activamos nosotros por ti',
                    content: tpConnected ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge-ok">
                          <CheckCircle2 size={11} /> conectado
                        </span>
                        <button
                          onClick={() => onSync('trustpilot', t.id)}
                          disabled={busy(`trustpilot-${t.id}`)}
                          className="btn-secondary btn-sm"
                        >
                          {busy(`trustpilot-${t.id}`) ? (
                            <Spinner label="Sincronizando…" size={13} />
                          ) : (
                            <>
                              <RefreshCw size={13} /> Sincronizar reseñas
                            </>
                          )}
                        </button>
                      </div>
                    ) : tpPending ? (
                      <p className="flex flex-wrap items-center gap-2 text-sm text-white">
                        <Clock size={15} className="animate-pulse text-amber-300" />
                        Solicitud recibida · pendiente de activación
                        <span className="badge-warn">nos encargamos nosotros</span>
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-sm leading-relaxed text-ink-300">
                          Si ya tienes cuenta de empresa en Trustpilot, pulsa el botón: nosotros
                          pedimos el acceso con tu permiso y dejamos la sincronización montada. No
                          tienes que escribir ninguna clave.
                        </p>
                        <button onClick={connectTrustpilot} disabled={saving} className="btn-primary btn-sm">
                          {saving ? <Spinner label="Solicitando…" size={13} /> : <><Link2 size={13} /> Conectar cuenta</>}
                        </button>
                      </div>
                    ),
                  },
                  {
                    id: `${t.id}-tripadvisor`,
                    title: 'TripAdvisor',
                    icon: <MapPin size={15} />,
                    meta: taConnected
                      ? 'Conectado · sincroniza solo'
                      : taPending
                        ? 'Pendiente de activación'
                        : 'Pega el enlace de tu ficha',
                    content: taConnected ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge-ok">
                          <CheckCircle2 size={11} /> conectado
                        </span>
                        <button
                          onClick={() => onSync('tripadvisor', t.id)}
                          disabled={busy(`tripadvisor-${t.id}`)}
                          className="btn-secondary btn-sm"
                        >
                          {busy(`tripadvisor-${t.id}`) ? (
                            <Spinner label="Sincronizando…" size={13} />
                          ) : (
                            <>
                              <RefreshCw size={13} /> Sincronizar reseñas
                            </>
                          )}
                        </button>
                      </div>
                    ) : taPending ? (
                      <p className="flex flex-wrap items-center gap-2 text-sm text-white">
                        <Clock size={15} className="animate-pulse text-amber-300" />
                        Solicitud recibida · buscando tu ficha
                        <span className="badge-warn">nos encargamos nosotros</span>
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <label className="label" htmlFor={`${t.id}-ta-url`}>Enlace de tu ficha en TripAdvisor</label>
                          <input
                            id={`${t.id}-ta-url`}
                            className="input"
                            placeholder="https://www.tripadvisor.es/… (copia y pega la dirección)"
                            value={taUrl}
                            onChange={(e) => setTaUrl(e.target.value)}
                          />
                          <p className="hint">
                            Tripa desde tu navegador, copia la dirección de tu ficha y pégala aquí:
                            el sistema localiza tu ficha solo.
                          </p>
                        </div>
                        <button onClick={connectTripadvisor} disabled={saving} className="btn-primary btn-sm">
                          {saving ? <Spinner label="Enviando…" size={13} /> : <><Link2 size={13} /> Conectar ficha</>}
                        </button>
                      </div>
                    ),
                  },
                  {
                    id: `${t.id}-whatsapp`,
                    title: 'Alertas WhatsApp (móvil del negocio)',
                    icon: <BellRing size={15} />,
                    meta: waTo ? `Destino ${waTo}` : 'Sin móvil configurado',
                    content: (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div>
                          <label className="label" htmlFor={`${t.id}-wa`}>Móvil que recibe las alertas ≤3★</label>
                          <input
                            id={`${t.id}-wa`}
                            className="input"
                            placeholder="34612345678"
                            value={waTo}
                            onChange={(e) => setWaTo(e.target.value)}
                            inputMode="tel"
                            autoComplete="tel"
                          />
                          <p className="hint">
                            Formato internacional sin + ni espacios. Cada alerta usa 1 de tus
                            peticiones del mes. El cliente de a pie nunca recibe estas alertas.
                          </p>
                        </div>
                        <div className="flex items-end gap-2">
                          <button onClick={testWhatsapp} disabled={saving} className="btn-secondary btn-sm h-[42px]">
                            {saving ? <Spinner label="Enviando…" size={13} /> : 'Probar envío'}
                          </button>
                          {!preview && (
                            <button onClick={saveSettings} disabled={saving} className="btn-primary btn-sm h-[42px]">
                              Guardar
                            </button>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: `${t.id}-tone`,
                    title: 'Tu negocio ante la IA',
                    icon: <Bot size={15} />,
                    meta: bizType ? `${tone} · ${bizType}` : `Actual: ${tone}`,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div>
                          <label className="label" htmlFor={`${t.id}-tone`}>Cómo debe sonar tu marca</label>
                          <select
                            id={`${t.id}-tone`}
                            className="select"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                          >
                            <option value="profesional">Profesional — cordial y resolutivo</option>
                            <option value="cercano">Cercano — amable y próximo</option>
                            <option value="formal">Formal — distinguido y serio</option>
                          </select>
                          <p className="hint">Se aplica a todos los borradores desde el siguiente.</p>
                          <label className="label mt-3" htmlFor={`${t.id}-biztype`}>
                            ¿A qué se dedica tu negocio?
                          </label>
                          <input
                            id={`${t.id}-biztype`}
                            className="input"
                            list={`${t.id}-biztype-list`}
                            placeholder="Bar con terraza, clínica dental, taller mecánico…"
                            value={bizType}
                            onChange={(e) => setBizType(e.target.value)}
                            maxLength={80}
                            disabled={preview}
                          />
                          <datalist id={`${t.id}-biztype-list`}>
                            {[
                              'Bar',
                              'Bar con terraza',
                              'Restaurante',
                              'Cafetería',
                              'Pizzería a domicilio',
                              'Peluquería',
                              'Salón de belleza',
                              'Clínica dental',
                              'Fisioterapia',
                              'Hotel',
                              'Taller mecánico',
                              'Tienda online',
                              'Tienda física',
                              'Gimnasio',
                            ].map((x) => (
                              <option key={x} value={x} />
                            ))}
                          </datalist>
                          <p className="hint">
                            Con esto, la IA responde «como un bar» o «como una clínica»: usa las
                            palabras de tu sector y conoce tu forma de trabajar.
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="label" htmlFor={`${t.id}-cemail`}>Email de contacto</label>
                              <input
                                id={`${t.id}-cemail`}
                                type="email"
                                className="input"
                                placeholder="hola@tunegocio.es"
                                value={cEmail}
                                onChange={(e) => setCEmail(e.target.value)}
                                maxLength={160}
                                disabled={preview}
                              />
                            </div>
                            <div>
                              <label className="label" htmlFor={`${t.id}-cphone`}>Teléfono</label>
                              <input
                                id={`${t.id}-cphone`}
                                className="input"
                                placeholder="600 123 456"
                                value={cPhone}
                                onChange={(e) => setCPhone(e.target.value)}
                                maxLength={24}
                                disabled={preview}
                              />
                            </div>
                            <div>
                              <label className="label" htmlFor={`${t.id}-cweb`}>Web o redes</label>
                              <input
                                id={`${t.id}-cweb`}
                                className="input"
                                placeholder="tunegocio.es"
                                value={cWeb}
                                onChange={(e) => setCWeb(e.target.value)}
                                maxLength={200}
                                disabled={preview}
                              />
                            </div>
                          </div>
                          <p className="hint">
                            Si una respuesta necesita invitar a contactar, la IA usará SOLO estos
                            datos tuyos; nunca mencionará a ReviewFlow ni a terceros.
                          </p>
                        </div>
                        <div className="flex items-end">
                          <button onClick={saveSettings} disabled={saving} className="btn-primary btn-sm h-[42px]">
                            {saving ? <Spinner label="Guardando…" size={13} /> : 'Guardar ajustes'}
                          </button>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />

              {!t.access && (
                <p className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  Las integraciones están en pausa porque la suscripción no está activa. Reactívala
                  desde Facturación para volver a sincronizar, generar respuestas y enviar alertas.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
