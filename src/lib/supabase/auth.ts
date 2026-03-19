import { cache } from 'react';
import { createClient } from './server';

interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Request-scoped cached auth check.
 * getSession() reads the JWT from the cookie locally — no network call to Supabase Auth.
 * React.cache deduplicates across layout + page + actions within a single RSC render.
 * DB-level security is enforced by Supabase RLS on every query.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? undefined };
});
