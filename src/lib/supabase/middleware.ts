import { type NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight auth routing based on cookie presence only.
 * No external API calls (no getUser/getSession) to avoid Edge timeouts.
 * Actual session validation happens server-side in layouts/actions.
 */
export function updateSession(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/lp') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  // Check for Supabase auth cookie presence (no API call)
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'),
  );

  // Redirect unauthenticated root access to landing page
  if (!hasAuthCookie && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/lp';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login
  if (!hasAuthCookie && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (hasAuthCookie && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
