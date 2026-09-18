import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';

/** Plantilla premium para páginas legales (misma estética que el resto del producto). */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-ink-950 text-ink-100">
      <SiteHeader
        variant="simple"
        right={
          <Link href="/" className="btn-secondary btn-sm">
            <ArrowLeft size={14} /> Volver
          </Link>
        }
      />

      <main className="relative mx-auto max-w-3xl px-4 py-14">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/12 blur-[110px]" aria-hidden />
        <div className="relative">
          <p className="kicker flex items-center gap-2">
            <Scale size={13} /> Legal
          </p>
          <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-500">Última actualización: {updated}</p>

          <article className="card mt-8 p-6 sm:p-9">
            <div className="legal-prose-dark">{children}</div>
          </article>

          <nav className="mt-6 flex flex-wrap gap-2 text-xs">
            {[
              ['Aviso legal', '/aviso-legal'],
              ['Privacidad', '/privacidad'],
              ['Términos', '/terminos'],
              ['Cookies', '/cookies'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="badge transition hover:border-white/25 hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
}
