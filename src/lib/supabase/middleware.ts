import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]): void {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/lp') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  // Redirect unauthenticated root access to landing page
  if (!user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/lp';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Check onboarding completion for authenticated users on protected routes
  if (user && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
    try {
      const [profile] = await db
        .select({ onboardingCompleted: userProfiles.onboardingCompleted })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);

      // No profile or onboarding not completed → redirect to onboarding
      if (!profile || !profile.onboardingCompleted) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    } catch {
      // DB error — allow through rather than blocking the user
    }
  }

  return supabaseResponse;
}
