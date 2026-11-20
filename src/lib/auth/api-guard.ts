import type { APIContext } from 'astro';

export interface AuthResult {
  userId: string;
  orgRole: string | undefined;
}

/**
 * Validates Clerk session and optional role allow-list for API routes.
 * Returns AuthResult on success, or an HTTP 401/403 Response on failure.
 */
export function requireAuth(
  locals: APIContext['locals'],
  allowedRoles?: string[]
): AuthResult | Response {
  const { userId, orgRole } = locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (allowedRoles && allowedRoles.length > 0 && (!orgRole || !allowedRoles.includes(orgRole))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { userId, orgRole };
}
