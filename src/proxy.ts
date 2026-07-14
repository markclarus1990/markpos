import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
];

const onboardingRoute = '/onboarding';

function isOnboardingRoute(pathname: string): boolean {
  return pathname === onboardingRoute || pathname.startsWith(onboardingRoute);
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
}

function isProtectedRoute(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return false;
  }
  return !isPublicRoute(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (isProtectedRoute(pathname)) {
      return new NextResponse('Configuration error', { status: 500 });
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { count } = await supabase
    .from('organization_members')
    .select('organization_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .limit(1);

  const hasOrganization = (count ?? 0) > 0;

  if (hasOrganization && isOnboardingRoute(pathname)) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  if (!hasOrganization && isProtectedRoute(pathname) && !isOnboardingRoute(pathname)) {
    const url = new URL('/onboarding', request.url);
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute(pathname) && !isOnboardingRoute(pathname)) {
    const target = hasOrganization ? '/dashboard' : '/onboarding';
    const url = new URL(target, request.url);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
