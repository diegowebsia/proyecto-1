'use client';

import { useEffect, useState } from 'react';
import { useScroll, useTransform, type MotionValue } from 'framer-motion';

/**
 * Comportamiento compartido de TODAS las barras de navegación de la web
 * (v3.15.0): el mismo parallax glassmorphism de la cabecera pública.
 *
 * · `glassOpacity` — el cristal sube de opacidad 0.25 → 1 en los primeros
 *   `range` px de scroll (progresivo, no a saltos).
 * · `scrolled` — umbral (scroll > 24 px) para sombra, blur extra y contracción
 *   de altura que aplican los contenedores.
 * · `brandShift` — micro-parallax de la marca (sube 8 px) para dar profundidad.
 */
export function useHeaderGlass(
  range: [number, number] = [0, 90],
): { scrolled: boolean; glassOpacity: MotionValue<number>; brandShift: MotionValue<number> } {
  const { scrollY } = useScroll();
  const glassOpacity = useTransform(scrollY, range, [0.25, 1]);
  const brandShift = useTransform(scrollY, [0, 400], [0, -8]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrolled, glassOpacity, brandShift };
}
