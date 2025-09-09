import type { ClerkSessionClaims } from './types';

export type ValidatedSession = {
  userId: string;
  claims: ClerkSessionClaims;
  role?: string;
};

type ClerkAuthObject = {
  userId: string | null;
  sessionClaims?: unknown;
  orgRole?: string;
  redirectToSignIn: (opts: { returnBackUrl: string }) => Response;
};

export function validateSession(auth: ClerkAuthObject | undefined): ValidatedSession | null {
  if (!auth || !auth.userId || !auth.sessionClaims) {
    console.warn("Sesión inválida o incompleta");
    return null;
  }

  const claims = auth.sessionClaims as ClerkSessionClaims;
  const role = auth.orgRole;

  return {
    userId: auth.userId,
    claims,
    role
  };
}
