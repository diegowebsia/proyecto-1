'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircleHelp,
  Filter,
  Gauge,
  Inbox,
  Link2,
  Plug,
  ReceiptEuro,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react';
import { Accordion } from '@/components/Accordion';
import { EASE } from '@/components/Motion';

/**
 * Centro de ayuda del cliente (v3.14.0).
 *
 * FAQs desplegables cortas, en lenguaje NO técnico: explican qué hace cada
 * módulo y cómo ayuda a su negocio. Cada tarjeta de ayuda contextual («?»)
 * del panel puede abrir directamente la sección correspondiente mediante el
 * evento global `rf:open-help` con el id del tema.
 *
 * La parte técnica (credenciales, claves, webhooks, entorno del servidor) ya
 * NO aparece aquí: vive en /admin y en las guías internas del repositorio.
 */

export type HelpCenterProps = {
  open: boolean;
  onClose: () => void;
  /** Tema a abrir automáticamente (ver ids de `HELP_ITEMS`). */
  topic?: string | null;
};

export type HelpTopicId =
  | 'primeros'
  | 'resenas'
  | 'ia'
  | 'embudo'
  | 'conexiones'
  | 'cuotas'
  | 'facturacion';

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-ink-300">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ol>
  );
}

export function HelpCenter({ open, onClose, topic }: HelpCenterProps) {
  // Cierra con Escape y bloquea el scroll de fondo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const items: Array<{ id: HelpTopicId; title: string; icon: React.ReactNode; meta: string; content: React.ReactNode }> = [
    {
      id: 'primeros',
      title: 'Primeros pasos (5 min)',
      icon: <Rocket size={16} className="text-brand-300" />,
      meta: 'Para empezar',
      content: (
        <div className="space-y-3">
          <StepList
            items={[
              'Elige tu plan y activa la prueba de 7 días: durante la prueba no se te cobra nada.',
              'Conecta al menos una fuente de reseñas en «Empresa y conexiones» — es un botón de 1 clic, nosotros hacemos la parte técnica.',
              'Elige cómo quieres que suene tu marca (Profesional, Cercano o Formal) y responde tu primera reseña con un clic.',
            ]}
          />
          <p className="text-xs text-ink-500">
            Todo lo demás es automático: cada día importamos tus reseñas nuevas y te avisamos si
            alguna necesita atención.
          </p>
        </div>
      ),
    },
    {
      id: 'resenas',
      title: 'Tu bandeja de reseñas',
      icon: <Inbox size={16} className="text-brand-300" />,
      meta: 'Reseñas',
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-300">
            Aquí llegan todas las reseñas de Google, Trustpilot y tu web en un solo sitio. Cada una
            muestra su origen y si el cliente compró de verdad (una obligación legal europea que da
            confianza a los lectores).
          </p>
          <StepList
            items={[
              'Pulsa «Responder con IA»: en unos segundos tienes un borrador con tu tono, listo para editar.',
              'Pulsa «Publicar»: si es Google, la respuesta se publica directa en tu ficha.',
              'Las reseñas de 1 a 3★ se envían solas a la cola de gestión privada: nadie te verá discutir en público.',
            ]}
          />
        </div>
      ),
    },
    {
      id: 'ia',
      title: 'Respuestas con IA (tu redactor automático)',
      icon: <Sparkles size={16} className="text-brand-300" />,
      meta: 'IA',
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-300">
            La IA lee la reseña, el tono que elegiste y los datos de tu negocio, y escribe un
            borrador en segundos. Tú siempre decides: nada se publica sin tu visto bueno.
          </p>
          <StepList
            items={[
              'Dinos a qué te dedicas (bar, peluquería, taller…) en «Tu negocio ante la IA»: las respuestas sonarán a tu sector, no a un robot genérico.',
              'Si una respuesta necesita invitarte a contactar, la IA usa SOLO tu email, tu teléfono y tu web: nunca menciona a ReviewFlow ni a terceros.',
              'Cada respuesta usa parte de la «bolsa mensual» incluida en tu plan: nunca hay cargos sorpresa.',
              'Si la bolsa se agota antes de fin de mes, la IA se pausa y sigues respondiendo con plantillas preparadas.',
              'Si algún día el servicio externo de IA se cae, la plataforma lo detecta y usa igualmente una plantilla profesional.',
            ]}
          />
        </div>
      ),
    },
    {
      id: 'embudo',
      title: 'Tu enlace de valoraciones (embudo)',
      icon: <Filter size={16} className="text-brand-300" />,
      meta: 'Embudo',
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-300">
            Es TU enlace personal (con QR para el mostrador o el ticket). El cliente puntúa de 1 a
            5★ y le ofrecemos publicar en Google, TripAdvisor o Trustpilot; si quiere ayuda, nos
            deja un mensaje privado. Todas las puntuaciones ven las mismas plataformas: sin
            trucos ni filtros ocultos.
          </p>
          <StepList
            items={[
              'Descarga el QR y ponlo en el mostrador, el ticket o la factura.',
              'Si envías el enlace por WhatsApp o email, añade una «campaña» y verás qué canal te trae más reseñas.',
              'Aquí verás la media de estrellas, cuántos publican finalmente y los tickets privados pendientes.',
            ]}
          />
        </div>
      ),
    },
    {
      id: 'conexiones',
      title: 'Conectar Google, tu tienda o WhatsApp',
      icon: <Plug size={16} className="text-brand-300" />,
      meta: 'Conexiones',
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-300">
            No necesitas saber nada técnico: todo se activa con un clic y nuestro equipo (o Google
            mismo) completa la parte complicada por detrás. Si algo tardara, verás el estado
            «Pendiente de activación» y te avisamos al terminar.
          </p>
          <StepList
            items={[
              'Google: botón «Conectar con Google», inicias sesión en tu cuenta de empresa y listo.',
              'Trustpilot, TripAdvisor o tu tienda: pulsa «Conectar cuenta» y en unas horas queda activo.',
              'WhatsApp: escribe el móvil que debe recibir las alertas de reseñas malas. Nada más.',
            ]}
          />
          <p className="text-xs text-ink-500">
            Tus contraseñas y claves nunca se piden ni se guardan en este panel: viajan cifradas y
            solo las ve nuestro sistema.
          </p>
        </div>
      ),
    },
    {
      id: 'cuotas',
      title: 'Tus límites mensuales, explicados fácil',
      icon: <Gauge size={16} className="text-brand-300" />,
      meta: 'Cuotas',
      content: (
        <div className="space-y-2 text-sm leading-relaxed text-ink-300">
          <p>
            Tu plan incluye 4 contadores claros cada mes: <strong className="text-white">peticiones</strong>{' '}
            de reseñas, <strong className="text-white">reseñas importadas</strong>,{' '}
            <strong className="text-white">respuestas con IA</strong> y{' '}
            <strong className="text-white">sincronizaciones automáticas</strong>. Se ven siempre en
            verde, ámbar o rojo, como un depósito de combustible.
          </p>
          <p>
            Si uno llega al 100 %, esa función se pausa hasta el día 1 (o hasta que amplíes con una
            recarga puntual desde «Facturación»). <strong className="text-white">Nada se borra</strong> y
            nunca se te cobra de más por sorpresa.
          </p>
          <p>
            Cada plan guarda un histórico máximo de reseñas; si lo superas, se archivan las más
            antiguas automáticamente para que todo vaya rápido. ¿Necesitas más histórico? Se sube
            de plan o se amplía el almacenamiento.
          </p>
        </div>
      ),
    },
    {
      id: 'facturacion',
      title: 'Facturación, recargas y cambios de plan',
      icon: <ReceiptEuro size={16} className="text-emerald-300" />,
      meta: 'Pagos',
      content: (
        <div className="space-y-3">
          <StepList
            items={[
              'Pagos: todo lo gestiona Stripe (tarjeta o domiciliación). Tus datos bancarios nunca los vemos nosotros.',
              'Recargas puntuales: si un mes necesitas más, compras un paquete desde «Facturación y cuota» y se suma al instante. Sin permanencia ni cobros automáticos.',
              'Cambiar de plan o cancelar: 2 clics desde el mismo sitio; tu acceso sigue hasta el final del ciclo pagado.',
            ]}
          />
          <p className="text-xs text-ink-500">
            ¿Factura con los datos de tu empresa? Configúralos en el portal de facturación de Stripe
            y aparecerán en cada factura automáticamente.
          </p>
        </div>
      ),
    },
  ];

  const openIndex = Math.max(0, items.findIndex((i) => i.id === topic));
  const defaultOpen = topic ? [openIndex] : [0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/75 p-4 backdrop-blur-sm sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Ayuda"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="card my-4 w-full max-w-2xl overflow-hidden sm:my-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.3),rgba(139,92,246,0.25))] text-brand-200">
                  <CircleHelp size={17} />
                </span>
                <div>
                  <h2 className="text-base font-extrabold tracking-tightish text-white">Ayuda</h2>
                  <p className="text-2xs text-ink-400">Lo esencial en minutos · sin tecnicismos</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-quiet btn-sm" aria-label="Cerrar ayuda">
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-2">
              {/* key fuerza re-montaje para que el tema solicitado quede abierto */}
              <Accordion key={`${topic ?? 'root'}-${openIndex}`} exclusive defaultOpen={defaultOpen[0]} items={items} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-5 py-3">
              <p className="text-2xs text-ink-500">
                <Link2 size={11} className="mr-1 inline" />
                ¿Prefieres que lo hagamos nosotros? Escríbenos y respondemos en 24 h laborables.
              </p>
              <a href="/contacto" className="btn-secondary btn-sm" onClick={onClose}>
                Contactar
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
