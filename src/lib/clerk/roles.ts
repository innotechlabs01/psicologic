import type { ClerkSessionClaims } from "./types";

export function getUserRole(claims: ClerkSessionClaims | null | undefined): string | undefined {
  if (!claims || !claims.publicMetadata) return undefined;
  return claims.publicMetadata.role;
}


export function isClientRole(role?: string): boolean {
  return role === 'org:client';
}

export function isAdminRole(role?: string): boolean {
  return role === 'org:admin';
}
