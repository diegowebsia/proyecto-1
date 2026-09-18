'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Sparkles, Star, X } from 'lucide-react';
import { EASE } from '@/components/Motion';
import { useHeaderGlass } from '@/components/useHeaderGlass';
import { SITE } from '@/lib/site';
import { TRIAL_DAYS } from '@/lib/plans';
import { cn } from '@/lib/utils';

/**
 * Cabecera pública pegajosa con glassmorphism + parallax (v3.14.0).
 * v3.15.0: el comportamiento vive en `useHeaderGlass()` y lo comparten TODAS
 * las barras de navegación del sitio (panel, bienvenida, admin).
 *
 * · `sticky top-0 z-50` con superficie esmerilada (`backdrop-blur` +
 *   `bg-ink-950/80` + `border-b border-white/10`).
 * · Al hacer scroll hacia abajo: el fondo sube de opacidad PROGRESIVAMENTE
 *   (0 → 0.8 en los primeros ~90 px), la barra reduce su altura de forma
 *   sutil (h-20 → h-16), aparece una sombra suave y el blur aumenta.
 * · La marca hace un micro-parallax (el logo sube ligeramente más despacio)
 *   para dar sensación de profundidad sin mareo.
 */

const MARKETING_LINKS: Array<[string, string]> = [
  ['Cómo funciona', '#como-funciona'],
  ['Producto', '#funciones'],
  ['Planes', '#planes'],
  ['Ampliaciones', '#ampliaciones'],
  ['FAQ', '#faq'],
  ['Demo', '/demo/business'],
];

export function SiteHeader({
  variant = 'marketing',
  right,
}: {
  variant?: 'marketing' | 'simple';
  /** Slot derecho alternativo para la variante simple (p. ej. «Volver»). */
  right?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Parallax glassmorphism COMPARTIDO con el resto de barras de la web.
  const { scrolled, glassOpacity, brandShift } = useHeaderGlass();

  // Cierra el menú móvil al navegar o redimensionar.
  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'shadow-[0_14px_40px_-18px_rgba(2,6,23,0.9)]' : 'shadow-none',
      )}
    >
      {/* Superficie de vidrio con opacidad animada */}
      <motion.div
        aria-hidden
        style={{ opacity: glassOpacity }}
        className={cn(
          'absolute inset-0 -z-10 border-b bg-ink-950/80 backdrop-blur-md transition-all duration-300',
          scrolled ? 'border-white/10 backdrop-blur-lg saturate-150' : 'border-white/[0.04] saturate-125',
        )}
      />

      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-all duration-300',
          scrolled ? 'h-16' : 'h-20',
        )}
      >
        <motion.div
          style={{ y: variant === 'marketing' ? brandShift : 0 }}
          className="flex min-w-0 items-center"
        >
          <Link
            href="/"
            className={cn(
              'group flex items-center gap-2.5 font-bold tracking-tightish text-white transition-all duration-300',
              scrolled ? 'text-base' : 'text-lg',
            )}
          >
            <motion.span
              whileTap={{ scale: 0.94 }}
              className={cn(
                'flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#8b5cf6)] text-white shadow-[0_8px_24px_-10px_rgba(37,99,235,0.95)] transition-all duration-300 group-hover:scale-105',
                scrolled ? 'h-8 w-8' : 'h-9 w-9',
              )}
            >
              <Star size={scrolled ? 15 : 17} fill="currentColor" />
            </motion.span>
            <span className="truncate">{SITE.brand}</span>
          </Link>
        </motion.div>

        {variant === 'marketing' && (
          <>
            <nav className="hidden items-center gap-1 text-sm text-ink-300 md:flex" aria-label="Secciones">
              {MARKETING_LINKS.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={
                    href.startsWith('/demo')
                      ? 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-brand-200 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white'
                      : 'rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white'
                  }
                >
                  {href.startsWith('/demo') && <Sparkles size={13} className="text-brand-300" />}
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-quiet hidden sm:inline-flex">
                Entrar
              </Link>
              <Link href="/registro" className="btn-primary btn-sm group sm:btn">
                Probar {TRIAL_DAYS} días
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="btn-quiet btn-sm md:hidden"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </>
        )}

        {variant === 'simple' && <div className="flex items-center gap-2">{right}</div>}
      </div>

      {/* Menú móvil */}
      <AnimatePresence initial={false}>
        {variant === 'marketing' && menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden border-b border-white/[0.07] bg-ink-950/92 backdrop-blur-lg md:hidden"
          >
            <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3 text-sm" aria-label="Secciones (móvil)">
              {MARKETING_LINKS.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-medium text-ink-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {label}
                </a>
              ))}
              <div className="mt-1 flex gap-2">
                <Link href="/login" className="btn-secondary btn-sm flex-1 justify-center">
                  Entrar
                </Link>
                <Link href="/registro" className="btn-primary btn-sm flex-1 justify-center">
                  Probar {TRIAL_DAYS} días
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
