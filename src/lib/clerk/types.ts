// Tipos de Clerk compartidos (sesión + eventos del webhook).
export type ClerkSessionClaims = {
  email?: string;
  publicMetadata?: {
    role?: string;
    isNewUser?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

// Eventos de usuario de Clerk — consumidos por el webhook y la lógica de
// provisioning (src/lib/clerk/user-provisioning.ts).
export interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      verification: {
        status: string;
      };
    }>;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
    public_metadata: Record<string, any>;
    private_metadata: Record<string, any>;
    unsafe_metadata: Record<string, any>;
  };
}
