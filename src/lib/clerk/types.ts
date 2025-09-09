export type ClerkSessionClaims = {
  email?: string;
  publicMetadata?: {
    role?: string;
    isNewUser?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
