import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Update the user's session in the middleware
 * This ensures the session is refreshed on every request
 */
export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const clearSupabaseCookies = () => {
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) {
        request.cookies.delete(name);
        supabaseResponse.cookies.delete(name);
      }
    });
  };

  if (userError?.message?.toLowerCase().includes('refresh token')) {
    clearSupabaseCookies();
  }

  // Public auth routes that don't require authentication
  const publicAuthRoutes = ['/login', '/onboarding', '/api/auth', '/auth/callback'];
  const isPublicAuthRoute = publicAuthRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protect authenticated routes (redirect to login if not authenticated)
  if (!user && !isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
