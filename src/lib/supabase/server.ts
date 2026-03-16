import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient(): Promise<ReturnType<typeof createServerClient>> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]): void {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` can fail in Server Components when called from a read-only context.
            // This is expected and can be safely ignored if middleware refreshes the session.
          }
        },
      },
    },
  );
}
