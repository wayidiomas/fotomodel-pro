import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user is new (needs onboarding)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user exists in users table
        const { data: existingUser } = await (supabase
          .from('users') as any)
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // New user - redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Existing user - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
