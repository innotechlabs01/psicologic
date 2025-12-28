import { checkUserPaymentAccess } from './chechUserPaymentAccess';

// Simple helper to decide if a user may access a game.
// Currently checks payment status; you can add more rules (roles, licenses) later.
export async function checkUserGameAccess(userId: string | undefined | null, gameId: string | null | undefined) {
  if (!userId) return false;
  if (!gameId) return false;

  try {
    const { canAccess } = await checkUserPaymentAccess(userId);
    // TODO: extend rules (e.g., per-game purchase, per-role rules)
    return Boolean(canAccess);
  } catch (err) {
    console.warn('checkUserGameAccess error:', err);
    return false;
  }
}
