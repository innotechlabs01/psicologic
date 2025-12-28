import { clerkClient } from '@clerk/astro/server';
import type { APIRoute } from 'astro';

const TIMEOUT_MS = 5000;

export async function verifyClerkUser(context: any) {
  const { request, locals } = context;
  const auth = locals?.auth && locals.auth();
  const userId = auth?.userId;
  if (!userId) throw new Error('unauthenticated');

  // race with timeout to avoid blocking
  const clerkUser = await Promise.race([
    clerkClient(context).users.getUser(userId),
    new Promise((_, reject) => setTimeout(() => reject(new Error('clerk_timeout')), TIMEOUT_MS))
  ]).catch(err => {
    throw err;
  });

  if (!clerkUser) throw new Error('user_not_found');

  // Optionally: ensure user is not suspended (example field)
  // if (clerkUser.suspended) throw new Error('user_suspended');

  return clerkUser;
}
