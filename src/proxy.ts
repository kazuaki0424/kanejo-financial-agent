import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase セッションクッキーの存在確認（同期・外部通信なし）
 * クッキー名パターン: sb-<project-ref>-auth-token
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasSessionCookie(request);

  // 未ログイン → /login にリダイレクト（戻り先を保持）
  if (!isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ログイン済みで /login or /register → / にリダイレクト
  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/diagnosis/:path*',
    '/simulation/:path*',
  ],
};
