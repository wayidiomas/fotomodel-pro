import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth callback route - redirects to /login with the code
 * The browser client on /login will handle the PKCE code exchange
 * since it has access to the code_verifier stored in cookies
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Use the configured app URL instead of origin from request
  // This ensures redirects work correctly in production (Railway, etc.)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // If there's an error from the OAuth provider, redirect to login with error
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${appUrl}/login?error=${error}`);
  }

  // If there's a code, redirect to /login with the code
  // The browser client will handle the PKCE exchange
  if (code) {
    return NextResponse.redirect(`${appUrl}/login?code=${code}`);
  }

  // No code or error - redirect to login
  return NextResponse.redirect(`${appUrl}/login`);
}
