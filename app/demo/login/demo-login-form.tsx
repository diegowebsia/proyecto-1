'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, EyeOff, KeyRound, ShieldCheck, Star } from 'lucide-react';
import { EASE } from '@/components/Motion';
import { SITE } from '@/lib/site';

export function DemoLoginForm() {
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState<'idle' | 'checking' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('checking');
    setMessage(null);
    try {
      const res = await fetch('/api/demo/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data?.error ?? 'No se pudo verificar el código.');
        return;
      }
      window.location.href = data?.redirect ?? '/demo/business';
    } catch {
      setState('error');
      setMessage('Error de red. Inténtalo de nuevo.');
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 text-ink-100">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(139,92,246,0.22), transparent 70%), radial-gradient(50% 40% at 80% 100%, rgba(37,99,235,0.18), transparent 70%)',
        }}
      />
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="card relative w-full max-w-md overflow-hidden p-8"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[26rem] -translate-x-1/2 rounded-full bg-violet-500/20 blur-[90px]" aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-2.5 font-bold tracking-tightish text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#8b5cf6)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.95)]">
              <Star size={16} fill="currentColor" />
            </span>
            {SITE.brand}
          </p>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tighter text-white">
            Entorno de pruebas
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            Vista previa del panel tal y como lo verá un cliente suscrito (plan Pro o Business).
            Datos 100 % simulados: sin cobros, sin cuentas y sin acceso a información real.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="label" htmlFor="demo-code">
              Código de acceso que te facilitó nuestro equipo
            </label>
            <div className="relative">
              <KeyRound size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                id="demo-code"
                type={show ? 'text' : 'password'}
                autoComplete="off"
                className="input pl-10 pr-10"
                placeholder="••••••••••••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label={show ? 'Ocultar código' : 'Mostrar código'}
              >
                <EyeOff size={14} />
              </button>
            </div>

            {message && (
              <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {message}
              </p>
            )}

            <button type="submit" disabled={state === 'checking' || code.length < 8} className="btn-primary w-full">
              {state === 'checking' ? 'Verificando…' : (<>Entrar al entorno <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p className="mt-5 flex items-start gap-2 text-2xs leading-relaxed text-ink-500">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400" />
            El acceso caduca a las 8 h y no deja sesión en el navegador. El código lo genera el
            dueño del proyecto en el servidor y nunca está escrito en el público de la web.
          </p>
        </div>
      </motion.main>
    </div>
  );
}
