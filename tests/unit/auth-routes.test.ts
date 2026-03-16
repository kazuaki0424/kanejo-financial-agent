import { describe, it, expect } from 'vitest';

// Extract the public path check logic from middleware
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  );
}

// Extract the redirect logic
function getRedirectForUnauthenticated(pathname: string): string | null {
  if (isPublicPath(pathname)) return null;
  return `/login?redirect=${pathname}`;
}

function getRedirectForAuthenticated(pathname: string): string | null {
  if (pathname === '/login' || pathname === '/register') return '/';
  return null;
}

describe('isPublicPath', () => {
  it('treats /login as public', () => {
    expect(isPublicPath('/login')).toBe(true);
  });

  it('treats /login with params as public', () => {
    expect(isPublicPath('/login?redirect=/')).toBe(true);
  });

  it('treats /register as public', () => {
    expect(isPublicPath('/register')).toBe(true);
  });

  it('treats /api/auth/callback as public', () => {
    expect(isPublicPath('/api/auth/callback')).toBe(true);
  });

  it('treats /_next paths as public', () => {
    expect(isPublicPath('/_next/static/chunk.js')).toBe(true);
  });

  it('treats /favicon as public', () => {
    expect(isPublicPath('/favicon.ico')).toBe(true);
  });

  it('treats / as NOT public', () => {
    expect(isPublicPath('/')).toBe(false);
  });

  it('treats /settings as NOT public', () => {
    expect(isPublicPath('/settings')).toBe(false);
  });

  it('treats /diagnosis as NOT public', () => {
    expect(isPublicPath('/diagnosis')).toBe(false);
  });

  it('treats /onboarding as NOT public', () => {
    expect(isPublicPath('/onboarding')).toBe(false);
  });
});

describe('getRedirectForUnauthenticated', () => {
  it('redirects / to login with redirect param', () => {
    expect(getRedirectForUnauthenticated('/')).toBe('/login?redirect=/');
  });

  it('redirects /settings/profile to login', () => {
    expect(getRedirectForUnauthenticated('/settings/profile')).toBe('/login?redirect=/settings/profile');
  });

  it('does not redirect /login', () => {
    expect(getRedirectForUnauthenticated('/login')).toBeNull();
  });

  it('does not redirect /register', () => {
    expect(getRedirectForUnauthenticated('/register')).toBeNull();
  });

  it('does not redirect /api/auth/callback', () => {
    expect(getRedirectForUnauthenticated('/api/auth/callback')).toBeNull();
  });
});

describe('getRedirectForAuthenticated', () => {
  it('redirects /login to /', () => {
    expect(getRedirectForAuthenticated('/login')).toBe('/');
  });

  it('redirects /register to /', () => {
    expect(getRedirectForAuthenticated('/register')).toBe('/');
  });

  it('does not redirect / for authenticated users', () => {
    expect(getRedirectForAuthenticated('/')).toBeNull();
  });

  it('does not redirect /settings for authenticated users', () => {
    expect(getRedirectForAuthenticated('/settings')).toBeNull();
  });

  it('does not redirect /onboarding for authenticated users', () => {
    expect(getRedirectForAuthenticated('/onboarding')).toBeNull();
  });
});
