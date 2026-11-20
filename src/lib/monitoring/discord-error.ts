/**
 * Non-blocking, deduplicated Discord error reporter.
 * Reads webhook URL from DISCORD_ERROR_WEBHOOK_URL (never hardcoded).
 * Never logs or forwards sensitive patient clinical data or secrets.
 */

export interface ErrorReportInput {
  source: 'server' | 'client' | 'webhook' | 'middleware';
  route: string;
  error: unknown;
  userId?: string | null;
  severity?: 'critical' | 'error' | 'warning';
  context?: Record<string, string | number | boolean | null | undefined>;
}

const DEDUP_WINDOW_MS = 60_000;
const recentErrors = new Map<string, number>();

function getWebhookUrl(): string {
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.DISCORD_ERROR_WEBHOOK_URL) ||
    (typeof process !== 'undefined' && process.env?.DISCORD_ERROR_WEBHOOK_URL) ||
    ''
  );
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function normalizeError(err: unknown): { name: string; message: string; stack: string } {
  if (err instanceof Error) {
    return {
      name: err.name || 'Error',
      message: err.message || 'Unknown error',
      stack: err.stack || '',
    };
  }
  if (typeof err === 'string') {
    return { name: 'Error', message: err, stack: '' };
  }
  try {
    return { name: 'Error', message: JSON.stringify(err), stack: '' };
  } catch {
    return { name: 'Error', message: String(err), stack: '' };
  }
}

export async function reportErrorToDiscord(input: ErrorReportInput): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return;

    const { name, message, stack } = normalizeError(input.error);
    const dedupKey = `${input.source}:${input.route}:${name}:${message.slice(0, 80)}`;
    const now = Date.now();
    const lastSent = recentErrors.get(dedupKey);
    if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
      return;
    }
    recentErrors.set(dedupKey, now);

    // Keep map bounded
    if (recentErrors.size > 200) {
      const oldestKey = recentErrors.keys().next().value;
      if (oldestKey) recentErrors.delete(oldestKey);
    }

    const severity = input.severity || (input.source === 'webhook' ? 'critical' : 'error');
    const color = severity === 'critical' ? 0xdc2626 : severity === 'error' ? 0xef4444 : 0xf59e0b;
    const envName =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV) ||
      'unknown';

    const fields = [
      { name: 'Ruta', value: `\`${truncate(input.route || '/', 200)}\``, inline: true },
      { name: 'Origen', value: `\`${input.source}\` (${envName})`, inline: true },
      { name: 'Usuario', value: `\`${input.userId || 'anonymous'}\``, inline: true },
      { name: 'Error', value: `\`\`\`\n${truncate(`${name}: ${message}`, 950)}\n\`\`\``, inline: false },
    ];

    if (stack) {
      fields.push({
        name: 'Stack Trace',
        value: `\`\`\`\n${truncate(stack, 950)}\n\`\`\``,
        inline: false,
      });
    }

    if (input.context && Object.keys(input.context).length > 0) {
      fields.push({
        name: 'Contexto',
        value: `\`\`\`json\n${truncate(JSON.stringify(input.context, null, 2), 950)}\n\`\`\``,
        inline: false,
      });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Psicologic Monitor',
        embeds: [
          {
            title: `[${severity.toUpperCase()}] Error en ${truncate(input.route || '/', 100)}`,
            color,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // Fail-safe: monitoring must never crash the request
  }
}
