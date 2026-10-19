import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

// Cadencia del prompt de feedback (días) — ver spec 2026-10-18-feedback-revival-design.md
export const PROMPT_DAYS = 30;
export const REPROMPT_DAYS = 15;

export const GET: APIRoute = async ({ locals }) => {
  const { userId, orgRole } = locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Los admins no reciben el prompt
  if (orgRole === 'org:admin') {
    return new Response(
      JSON.stringify({
        shouldPrompt: false,
        lastFeedbackAt: null,
        promptDays: PROMPT_DAYS,
        repromptDays: REPROMPT_DAYS,
      }),
      { status: 200 },
    );
  }

  let lastFeedbackAt: string | null = null;
  try {
    const res = await db.execute({
      sql: 'SELECT metadata FROM usuarios WHERE clerk_user_id = ? LIMIT 1',
      args: [userId],
    });
    const metadataRaw = res.rows[0]?.metadata;
    if (metadataRaw) {
      try {
        const metadata = JSON.parse(String(metadataRaw));
        lastFeedbackAt = metadata?.last_feedback_at ?? null;
      } catch {
        // metadata corrupta → tratar como sin feedback
      }
    }
  } catch (error) {
    console.error('Error leyendo metadata para feedback status:', error);
  }

  const shouldPrompt =
    !lastFeedbackAt ||
    Date.now() - new Date(lastFeedbackAt).getTime() >= PROMPT_DAYS * 24 * 60 * 60 * 1000;

  return new Response(
    JSON.stringify({
      shouldPrompt,
      lastFeedbackAt,
      promptDays: PROMPT_DAYS,
      repromptDays: REPROMPT_DAYS,
    }),
    { status: 200 },
  );
};
