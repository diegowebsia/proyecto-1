'use client';

import { motion } from 'framer-motion';
import { useHeaderGlass } from '@/components/useHeaderGlass';
import { cn } from '@/lib/utils';

/**
 * Barra de navegación con el MISMO trato que la cabecera pública (v3.15.0):
 * sticky, cristal con opacidad progresiva al hacer scroll, blur creciente,
 * sombra suave al pasar el umbral y contracción de altura (tall → short).
 *
 * Lo usan el panel (`DashboardClient`), la bienvenida y el admin para que
 * NINGUNA barra de la web se quede estática.
 */
export function GlassHeader({
  children,
  maxWidth = 'max-w-6xl',
  z = 'z-30',
  tall = 'h-16',
  short = 'h-14',
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  z?: string;
  tall?: string;
  short?: string;
  className?: string;
  innerClassName?: string;
}) {
  const { scrolled, glassOpacity } = useHeaderGlass();

  return (
    <header
      className={cn(
        'sticky top-0 transition-shadow duration-300',
        z,
        scrolled ? 'shadow-[0_14px_40px_-18px_rgba(2,6,23,0.9)]' : 'shadow-none',
        className,
      )}
    >
      {/* Superficie de vidrio con opacidad animada (parallax del header) */}
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
          'mx-auto flex items-center justify-between gap-3 px-4 transition-[height] duration-300',
          maxWidth,
          scrolled ? short : tall,
          innerClassName,
        )}
      >
        {children}
      </div>
    </header>
  );
}
