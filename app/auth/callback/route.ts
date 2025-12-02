import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth callback route - redirects to /login with the code
 * The browser client on /login will handle the PKCE code exchange
 * since it has access to the code_verifier stored in cookies
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If there's an error from the OAuth provider, redirect to login with error
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${error}`);
  }

  // If there's a code, redirect to /login with the code
  // The browser client will handle the PKCE exchange
  if (code) {
    return NextResponse.redirect(`${origin}/login?code=${code}`);
  }

  // No code or error - redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
