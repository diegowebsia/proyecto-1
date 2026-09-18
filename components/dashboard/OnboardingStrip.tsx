'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Link2, PartyPopper, Plug, Sparkles, X } from 'lucide-react';
import { EASE } from '@/components/Motion';
import { cn } from '@/lib/utils';
import type { TenantInfo } from '@/components/dashboard/types';

/**
 * Panel de configuración guiada (v3.14.0 — patrón Podium/NiceJob).
 *
 * Checklist visual con barra de progreso que solo muestra lo que AL cliente le
 * falta: conectar una fuente, enlazar su ficha y responder la primera reseña
 * con IA. Desaparece al completar los pasos (o si lo cierra) — sin ruido.
 */
export type OnboardingAction = 'connections' | 'funnel' | 'replies';

export function OnboardingStrip({
  tenant,
  reviewedAny,
  onAction,
  preview = false,
}: {
  tenant: TenantInfo;
  reviewedAny: boolean;
  onAction: (a: OnboardingAction) => void;
  /** En la vista demo se marca como completada al pulsar (sin BD). */
  preview?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [previewDone, setPreviewDone] = useState<Record<string, boolean>>({});

  const connected = tenant.integrations.some((i) => i.status === 'connected' || i.status === 'pending_setup');
  const hasLink = Boolean(tenant.settings.place_id) || preview;
  const steps = useMemo(
    () => [
      {
        id: 'connect',
        done: connected || Boolean(previewDone.connect),
        label: 'Conecta tu primera fuente',
        desc: 'Google en 1 clic · el resto, asistido por nosotros',
        icon: Plug,
        action: 'connections' as const,
        cta: 'Conectar ahora',
      },
      {
        id: 'link',
        done: hasLink || Boolean(previewDone.link),
        label: 'Enlaza tu ficha de Google',
        desc: 'Pega el enlace de tu ficha y genera tu QR para el mostrador',
        icon: Link2,
        action: 'funnel' as const,
        cta: 'Ver embudo',
      },
      {
        id: 'reply',
        done: reviewedAny || Boolean(previewDone.reply),
        label: 'Responde tu primera reseña con IA',
        desc: 'Un borrador con tu tono en segundos · tú publicas',
        icon: Bot,
        action: 'replies' as const,
        cta: 'Ir a la bandeja',
      },
    ],
    [connected, hasLink, reviewedAny, previewDone],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  if (dismissed || allDone) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="card relative overflow-hidden border-brand-400/25 bg-[linear-gradient(140deg,rgba(37,99,235,0.10),rgba(124,58,237,0.06)_55%,transparent)] p-5"
      aria-label="Configuración guiada"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-full p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label="Ocultar configuración guiada"
      >
        <X size={14} />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tightish text-white">
          <Sparkles size={15} className="text-brand-300" />
          Configuración guiada
          <span className="badge-brand">{doneCount} de {steps.length} completados</span>
        </h2>
        <p className="text-2xs text-ink-400">
          {doneCount < steps.length ? 'Termina los pasos y tu reputación empieza a trabajar sola.' : '¡Todo listo!'}
        </p>
      </div>

      {/* Progreso */}
      <div className="meter mt-3.5" role="progressbar" aria-valuenow={Math.round((doneCount / steps.length) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de configuración">
        <motion.span
          className="bg-[linear-gradient(90deg,#2563eb,#5f92fb_55%,#8b5cf6)]"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / steps.length) * 100}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>

      <ol className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              'rounded-2xl border p-3.5 transition-all duration-300',
              s.done ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : 'border-white/[0.08] bg-white/[0.02] hover:border-brand-400/40',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-2xs font-bold transition-all duration-300',
                  s.done
                    ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                    : 'border-brand-400/40 bg-brand-500/15 text-brand-200',
                )}
                aria-hidden
              >
                {s.done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <p className="text-sm font-bold text-white">{s.label}</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{s.desc}</p>
            {s.done ? (
              <p className="mt-2 inline-flex items-center gap-1 text-2xs font-semibold text-emerald-300">
                <PartyPopper size={12} /> Completado
              </p>
            ) : (
              <button
                onClick={() => {
                  if (preview) setPreviewDone((d) => ({ ...d, [s.id]: true }));
                  onAction(s.action);
                }}
                className="btn-secondary btn-sm mt-2.5 w-full justify-center"
              >
                <s.icon size={13} /> {s.cta}
              </button>
            )}
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

/** Contenedor animado para ocultar la franja con suavidad. */
export function OnboardingPresence(props: React.ComponentProps<typeof OnboardingStrip>) {
  return (
    <AnimatePresence initial={false}>
      <OnboardingStrip key="onboarding" {...props} />
    </AnimatePresence>
  );
}
