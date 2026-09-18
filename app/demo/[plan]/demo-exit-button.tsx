'use client';

import { ArrowLeft } from 'lucide-react';

/** Cierra la sesión de pruebas (invalidando la cookie firmada) y vuelve al inicio. */
export function DemoExitButton() {
  async function exit() {
    try {
      await fetch('/api/demo/access', { method: 'DELETE' });
    } catch {
      /* si fallase la llamada, la cookie caduca a las 8 h igualmente */
    }
    window.location.href = '/';
  }
  return (
    <button
      type="button"
      onClick={exit}
      className="hidden items-center gap-1 text-violet-200 underline-offset-2 transition-colors hover:text-white hover:underline md:inline-flex"
    >
      <ArrowLeft size={11} /> Salir
    </button>
  );
}
