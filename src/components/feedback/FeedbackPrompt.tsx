import React, { useEffect, useState } from 'react';
import FeedbackForm from './FeedbackForm';

const DISMISS_KEY = 'psicologic:feedback-dismissed-at';

type PromptState = 'checking' | 'hidden' | 'visible' | 'pill';

/**
 * Prompt recurrente de feedback para psicólogos.
 * - Aparece si pasó un mes (PROMPT_DAYS, server-side) desde el último feedback.
 * - Si se descarta, vuelve a los 15 días (REPROMPT_DAYS); en la sesión queda
 *   un pill discreto para reabrirlo.
 * - client:only (usa localStorage) + transition:persist (se consulta el
 *   status UNA vez por sesión, no en cada navegación).
 */
export default function FeedbackPrompt() {
  const [state, setState] = useState<PromptState>('checking');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/feedback/status');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.shouldPrompt) return;

        // ¿Lo descartó hace menos de repromptDays?
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
        const repromptMs = (data.repromptDays || 15) * 24 * 60 * 60 * 1000;
        if (dismissedAt && Date.now() - dismissedAt < repromptMs) return;

        // Dejar que la página cargue primero: acompaña, no interrumpe.
        setTimeout(() => {
          if (!cancelled) setState('visible');
        }, 1500);
      } catch {
        /* feedback es best-effort: nunca romper la navegación */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Animación de entrada
  useEffect(() => {
    if (state !== 'visible') return;
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, [state]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setState('pill');
  };

  if (state === 'checking' || state === 'hidden') return null;

  if (state === 'pill') {
    return (
      <button
        type="button"
        onClick={() => {
          setEntered(false);
          setState('visible');
        }}
        className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/30 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="text-base">💚</span>
        Danos tu feedback
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Feedback de Psicologic"
      className={`fixed bottom-4 right-4 z-[70] max-h-[88vh] w-[min(92vw,30rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-500 dark:bg-gray-900 ${
        entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 py-3 backdrop-blur dark:bg-gray-900/90">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Tu opinión construye Psicologic
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-2 pb-2 pt-1 sm:px-3">
        <FeedbackForm onSuccess={() => setState('hidden')} />
      </div>

      <div className="px-5 pb-4 pt-1">
        <button
          type="button"
          onClick={dismiss}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-500"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
