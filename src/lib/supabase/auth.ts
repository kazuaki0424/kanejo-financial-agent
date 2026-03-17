import { cache } from 'react';
import { createClient } from './server';

interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Request-scoped cached auth check.
 * React.cache deduplicates across layout + page + actions within a single RSC render.
 * Returns null if not authenticated (never redirects — caller decides).
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? undefined } : null;
});
