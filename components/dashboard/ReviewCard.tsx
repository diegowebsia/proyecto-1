'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Bot, CheckCircle2, PartyPopper, Send, Sparkles, Undo2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/Skeleton';
import { Stars } from '@/components/dashboard/Stars';
import { HelpTip } from '@/components/HelpTip';
import { EASE } from '@/components/Motion';
import { describeApiError } from '@/components/dashboard/types';
import type { DemoReview } from '@/lib/demo';
import { cn } from '@/lib/utils';

/**
 * Reseña de la bandeja: borrador IA → edición → publicación.
 * Cada borrador consume 1 evento de IA (controlado por el backend).
 */
export function ReviewCard({
  review: r,
  draft,
  published,
  tone,
  demo = false,
  onDraftChange,
  onPublished,
}: {
  review: DemoReview;
  draft?: string;
  published: boolean;
  tone: 'profesional' | 'cercano' | 'formal';
  /** Vista demo: redacta y publica una simulación local. */
  demo?: boolean;
  onDraftChange: (id: string, value: string) => void;
  onPublished: (id: string) => void;
}) {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDraft, setShowDraft] = useState(Boolean(draft));

  const replied = r.replied || published;
  const [publishedJustNow, setPublishedJustNow] = useState(false);

  const PREVIEW_REPLIES: Record<string, string> = {
    profesional:
      r.rating >= 4
      ? `Hola ${r.author.split(' ')[0]}, muchas gracias por su valoración. Nos alegra saber que la experiencia ha sido positiva; seguimos trabajando para mantenerla.`
      : `Hola ${r.author.split(' ')[0]}, gracias por decírnoslo. Lamentamos la experiencia; nos gustaría entender mejor qué ocurrió y darle una solución directa. ¿Nos escriben a través del panel o de su canal habitual?`,
    cercano:
      r.rating >= 4
      ? `¡Hola, ${r.author.split(' ')[0]}! Mil gracias por tus palabras 🎉 Nos hace mucha ilusión saber que lo pasaste bien. ¡Te esperamos pronto!`
      : `Hola, ${r.author.split(' ')[0]}: sentimos mucho que esta vez no haya sido lo que esperabas. Queremos arreglarlo contigo en persona: escríbenos y lo vemos hoy mismo.`,
    formal:
      r.rating >= 4
        ? `Estimado/a ${r.author.split(' ')[0]}, agradecemos sinceramente su valoración. Para nuestro equipo supone un estímulo para seguir ofreciendo un servicio excelente.`
        : `Estimado/a ${r.author.split(' ')[0]}, lamentamos la experiencia descrita. Quedamos a su disposición para estudiar su caso y ofrecerle la atención que merece.`,
  };

  async function generateReply() {
    setGenerating(true);
    setShowDraft(true);
    if (demo) {
      // Simulación local del borrador de IA (vista demo): sin cuotas ni APIs.
      await new Promise((a) => setTimeout(a, 1400));
      onDraftChange(r.id, PREVIEW_REPLIES[tone] ?? PREVIEW_REPLIES.profesional);
      setGenerating(false);
      toast({
        kind: 'success',
        title: 'Borrador listo (demo)',
        body: 'En el panel real usa tu IA incluida en el plan · revísalo antes de publicar',
      });
      return;
    }
    try {
      const res = await fetch('/api/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: r.id,
          businessName: r.tenant,
          authorName: r.author,
          rating: r.rating,
          reviewText: r.text,
          tone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body, action: described.action });
        return;
      }
      onDraftChange(r.id, data.reply ?? '');
      toast({
        kind: 'success',
        title: 'Borrador listo',
        body: `${data.provider === 'openai' ? 'OpenAI' : 'Plantilla local'} · revísalo antes de publicar`,
      });
      window.dispatchEvent(new Event('rf:quota-refresh'));
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo generar el borrador', body: e?.message });
    } finally {
      setGenerating(false);
    }
  }

  async function publishReply() {
    const reply = (draft ?? '').trim();
    if (reply.length < 2) {
      toast({ kind: 'warning', title: 'Respuesta demasiado corta', body: 'Escribe al menos 2 caracteres.' });
      return;
    }
    if (demo) {
      setPublishing(true);
      await new Promise((a) => setTimeout(a, 900));
      setPublishing(false);
      onPublished(r.id);
      setPublishedJustNow(true);
      toast({ kind: 'success', title: 'Respuesta publicada (demo)', body: 'Así de simple es en el panel real: 1 clic y queda publicada.' });
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch('/api/reviews/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: r.id, reply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const described = describeApiError(res.status, data);
        toast({ kind: described.kind, title: described.title, body: described.body, action: described.action });
        return;
      }
      onPublished(r.id);
      setPublishedJustNow(true);
      toast({
        kind: 'success',
        title: data.pushedToGoogle ? 'Publicada en Google' : 'Respuesta guardada',
        body: data.message,
      });
    } catch (e: any) {
      toast({ kind: 'error', title: 'No se pudo publicar', body: e?.message });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={cn('card card-hover', replied && 'border-emerald-400/20')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold tracking-tightish text-white">
            {r.author} <span className="font-normal text-ink-500">· {r.tenant}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-400">
            <Stars n={r.rating} />
            <span className="badge capitalize">{r.source}</span>
            {r.verified && (
              <span className="badge-ok">
                <BadgeCheck size={11} /> Verificada
              </span>
            )}
            <span>{new Date(r.created_at).toLocaleDateString('es-ES')}</span>
            {replied ? (
              <motion.span
                initial={publishedJustNow ? { scale: 0.6, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                className="badge-ok"
              >
                {publishedJustNow ? <PartyPopper size={11} /> : <CheckCircle2 size={11} />} respondida
              </motion.span>
            ) : (
              <span className="badge-warn">pendiente</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HelpTip
            title="Responder con IA"
            what="La IA lee la reseña y tu tono, y te propone la respuesta perfecta en segundos. Tú la revisas, la editas si quieres y la publicas con un clic."
            helps="Responder rápido a todas las reseñas mejora tu ranking en Google y fideliza: es la acción con más retorno de toda la plataforma."
            steps={['Pulsa «Responder con IA»', 'Edita lo que quieras', 'Publica: en Google sale directa']}
            helpTopic="resenas"
          />
          {r.reply && !draft && (
            <button
              onClick={() => {
                onDraftChange(r.id, r.reply as string);
                setShowDraft(true);
              }}
              className="btn-quiet btn-sm"
            >
              <Undo2 size={13} /> Ver respuesta
            </button>
          )}
          <button
            disabled={generating}
            onClick={generateReply}
            className={cn('btn-sm', replied ? 'btn-secondary' : 'btn-primary')}
          >
            {generating ? <Spinner label="Generando…" size={13} /> : (<><Bot size={13} /> Responder con IA</>)}
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-200">{r.text}</p>

      {generating && (
        <div className="mt-3 space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5" aria-busy="true">
          <p className="flex items-center gap-2 text-xs font-semibold text-brand-200">
            <Sparkles size={13} className="animate-pulse" /> La IA está redactando tu respuesta…
          </p>
          <span className="skeleton block h-3 w-full" />
          <span className="skeleton block h-3 w-11/12" />
          <span className="skeleton block h-3 w-2/3" />
        </div>
      )}

      <AnimatePresence initial={false}>
        {showDraft && draft !== undefined && !generating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-brand-400/25 bg-brand-500/10 p-3.5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-200">
                <Sparkles size={13} /> Borrador IA — revísalo antes de publicar
              </p>
              <textarea
                className="textarea mt-2.5 min-h-[104px] bg-ink-950/60"
                value={draft}
                onChange={(e) => onDraftChange(r.id, e.target.value)}
                aria-label="Borrador de respuesta"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  disabled={publishing}
                  onClick={publishReply}
                  className="btn-primary btn-sm"
                >
                  {publishing ? <Spinner label="Publicando…" size={13} /> : (<><Send size={13} /> Publicar respuesta</>)}
                </button>
                <button onClick={() => setShowDraft(false)} className="btn-quiet btn-sm">
                  Ocultar
                </button>
                <span className="ml-auto text-2xs text-ink-500">
                  {r.source === 'google'
                    ? 'Con Google conectado se publica directamente en la plataforma.'
                    : 'Se guarda en tu bandeja y puedes copiarla a la plataforma.'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
