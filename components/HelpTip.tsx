'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { EASE } from '@/components/Motion';
import { cn } from '@/lib/utils';

/**
 * Ayuda contextual en cada módulo del panel (v3.14.0).
 *
 * Icono «?» accesible que explica la funcionalidad EN LENGUAJE NO TÉCNICO y
 * cómo ayuda al negocio. Se abre con clic, toque, hover o foco de teclado y
 * ofrece un enlace «Abrir ayuda» que lanza el Centro de ayuda en la sección
 * concreta de ese módulo (evento global `rf:open-help`).
 */
export type HelpTipProps = {
  /** Título corto de la tarjeta de ayuda. */
  title: string;
  /** Qué es el módulo, sin tecnicismos. */
  what: string;
  /** Cómo ayuda al negocio del cliente. */
  helps: string;
  /** Pasos muy cortos (máx. 3) para aprovecharlo ya. */
  steps?: string[];
  /** Sección del Centro de ayuda que amplía la explicación. */
  helpTopic?: string;
  className?: string;
  /** Alineación de la tarjeta: por defecto a la derecha del icono. */
  align?: 'start' | 'end';
};

export function HelpTip({ title, what, helps, steps, helpTopic, className, align = 'end' }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }
  function toggle() {
    setOpen((v) => !v);
  }

  function openHelpCenter() {
    window.dispatchEvent(new CustomEvent('rf:open-help', { detail: helpTopic ?? null }));
    setOpen(false);
  }

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        aria-label={`Ayuda: ${title}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        onFocus={show}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
          open
            ? 'border-brand-400/60 bg-brand-500/20 text-brand-100 scale-105'
            : 'border-white/15 bg-white/[0.04] text-ink-400 hover:border-brand-400/40 hover:text-brand-200',
        )}
      >
        <HelpCircle size={13} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* área invisible que mantiene el popover abierto al pasar al ratón */}
            <span
              className="fixed inset-0 z-40 cursor-default"
              aria-hidden
              onMouseEnter={show}
              onClick={() => setOpen(false)}
            />
            <motion.span
              role="tooltip"
              id={id}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE }}
              onMouseEnter={show}
              onMouseLeave={hide}
              className={cn(
                'absolute top-7 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-ink-900/95 p-3.5 text-left shadow-[0_24px_60px_-24px_rgba(2,6,23,1)] backdrop-blur-md',
                align === 'end' ? 'right-0' : 'left-0',
              )}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-200">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-200">{what}</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-emerald-200/90">
                <span aria-hidden className="mt-0.5">→</span> {helps}
              </p>
              {steps && steps.length > 0 && (
                <ol className="mt-2.5 list-decimal space-y-1 border-t border-white/[0.07] pt-2.5 pl-4 text-xs leading-relaxed text-ink-300">
                  {steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
              {helpTopic && (
                <button type="button" onClick={openHelpCenter} className="btn-quiet btn-sm mt-2.5 w-full justify-center">
                  Leer la guía completa de este módulo
                </button>
              )}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
